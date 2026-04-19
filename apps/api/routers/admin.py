from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
import secrets
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional
from core.database import get_db
from core.deps import require_admin, RequiredAdmin
from core.supabase import supabase_admin
from repositories.user import UserRepository
from repositories.artwork import ArtworkRepository
from repositories.order import OrderRepository
from schemas.user import UserResponse
from schemas.order import OrderListResponse

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    user: RequiredAdmin,
    role: str = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    users, _ = await repo.list_all(skip=skip, limit=limit, role=role)
    return users

async def get_or_create_admin_secret_key(db: AsyncSession) -> str:
    from models import SystemSetting
    stmt = select(SystemSetting).where(SystemSetting.key == "admin_secret_key")
    setting = (await db.execute(stmt)).scalar_one_or_none()
    
    if not setting or setting.value == "NOT_SET":
        new_key = secrets.token_urlsafe(32)
        if not setting:
            setting = SystemSetting(key="admin_secret_key", value=new_key)
            db.add(setting)
        else:
            setting.value = new_key
        await db.commit()
        await db.refresh(setting)
        
    return setting.value

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role: str,
    admin: RequiredAdmin,
    secret_key: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if role not in ("artist", "buyer", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
        
    if role == "admin":
        stored_key = await get_or_create_admin_secret_key(db)
        if stored_key != secret_key:
            raise HTTPException(status_code=403, detail="Invalid admin secret key")

    repo = UserRepository(db)
    target = await repo.get_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404)
    try:
        supabase_admin.auth.admin.update_user_by_id(
            str(target.supabase_user_id),
            {"app_metadata": {"role": role}}
        )
    except Exception as e:
        # Log and continue — we prioritize local DB as the source of truth if Supabase sync is restricted
        print(f"Warning: Failed to sync role to Supabase for {user_id}: {e}")
        
    await repo.set_role(target, role)
    return {"ok": True}

@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    is_active: bool,
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    target = await repo.get_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404)
    await repo.set_active_status(target, is_active)
    return {"ok": True}

@router.get("/artworks")
async def list_all_artworks(
    admin: RequiredAdmin,
    status_filter: str = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    if status_filter:
        artworks, total = await repo.get_by_artist(None, status=status_filter, skip=skip, limit=limit)
    else:
        artworks, total = await repo.get_published(skip=skip, limit=limit)
    return {"artworks": [{"id": str(a.id), "title": a.title, "status": a.status, "artist": a.artist.email if a.artist else "Unknown"} for a in artworks], "total": total}

@router.patch("/artworks/{artwork_id}/status")
async def moderate_artwork(
    artwork_id: UUID,
    status: str,
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    if status not in ("published", "rejected", "archived", "draft"):
        raise HTTPException(status_code=400, detail="Invalid status")
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404)
    await repo.update(artwork, {"status": status})
    return {"ok": True}

@router.get("/orders", response_model=OrderListResponse)
async def list_all_orders(
    admin: RequiredAdmin,
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    repo = OrderRepository(db)
    orders, total = await repo.get_all(skip=skip, limit=limit, status=status)
    return OrderListResponse(orders=orders, total=total)

@router.get("/stats")
async def get_admin_stats(
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    from models import User, Artwork, Order
    
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_artworks = (await db.execute(select(func.count()).select_from(Artwork))).scalar()
    pending_artworks = (await db.execute(select(func.count()).select_from(Artwork).where(Artwork.status == "pending"))).scalar()
    total_revenue = (await db.execute(select(func.sum(Order.total_amount)).where(Order.status == "paid"))).scalar() or 0
    active_orders = (await db.execute(select(func.count()).select_from(Order).where(Order.status == "paid"))).scalar()
    
    return {
        "total_users": total_users,
        "total_artworks": total_artworks,
        "pending_artworks": pending_artworks,
        "total_revenue": float(total_revenue),
        "active_orders": active_orders
    }

@router.post("/auth/verify-password")
async def verify_admin_password(
    admin: RequiredAdmin,
    password: str = Body(..., embed=True),
):
    """Verifies the password for the currently logged in admin."""
    try:
        # We use the admin's email to verify their password via Supabase
        res = supabase_admin.auth.sign_in_with_password({
            "email": admin.email,
            "password": password
        })
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid password")
        return {"ok": True}
    except Exception as e:
        print(f"Password verification failed: {e}")
        raise HTTPException(status_code=401, detail="Verification failed")

@router.get("/settings/secret-key")
async def get_secret_key(
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    key = await get_or_create_admin_secret_key(db)
    return {"key": key}

@router.post("/settings/secret-key")
async def update_secret_key(
    admin: RequiredAdmin,
    new_key: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
):
    from models import SystemSetting
    stmt = select(SystemSetting).where(SystemSetting.key == "admin_secret_key")
    setting = (await db.execute(stmt)).scalar_one_or_none()
    
    if setting:
        setting.value = new_key
    else:
        setting = SystemSetting(key="admin_secret_key", value=new_key)
        db.add(setting)
    
    await db.commit()
    return {"ok": True}

