from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from core.database import get_db
from core.deps import require_admin, RequiredAdmin
from core.supabase import supabase_admin
from repositories.user import UserRepository
from repositories.artwork import ArtworkRepository
from schemas.user import UserResponse

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

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role: str,
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    if role not in ("artist", "buyer", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    repo = UserRepository(db)
    target = await repo.get_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404)
    supabase_admin.auth.admin.update_user_by_id(
        str(target.supabase_user_id),
        {"app_metadata": {"role": role}}
    )
    await repo.set_role(target, role)
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
    return {"artworks": [{"id": str(a.id), "title": a.title, "status": a.status} for a in artworks], "total": total}

@router.get("/stats")
async def get_admin_stats(
    admin: RequiredAdmin,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func
    from models import User, Artwork
    
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_artworks = (await db.execute(select(func.count()).select_from(Artwork))).scalar()
    pending_artworks = (await db.execute(select(func.count()).select_from(Artwork).where(Artwork.status == "pending"))).scalar()
    
    return {
        "total_users": total_users,
        "total_artworks": total_artworks,
        "pending_artworks": pending_artworks
    }

