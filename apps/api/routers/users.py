from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.deps import get_current_user, CurrentUser
from core.supabase import supabase_admin
from repositories.user import UserRepository
from schemas.user import UserResponse, OnboardRequest, ProfileUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: CurrentUser):
    return user


@router.post("/me/onboard", response_model=UserResponse)
async def onboard(
    request: Request,
    body: OnboardRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Set role and create profile. Called after Supabase signup."""
    if body.role not in ("artist", "buyer"):
        raise HTTPException(status_code=400, detail="Role must be 'artist' or 'buyer'")
    if user.role is not None:
        raise HTTPException(status_code=409, detail="User already onboarded")

    repo = UserRepository(db)
    # Update role in Supabase Auth (app_metadata) so JWT reflects it on next refresh
    supabase_admin.auth.admin.update_user_by_id(
        str(user.supabase_user_id),
        {"app_metadata": {"role": body.role}}
    )
    # Update role in our DB
    await repo.set_role(user, body.role)
    # Create profile
    if body.role == "artist":
        await repo.create_artist_profile(user.id, body.display_name, body.bio, body.website_url)
    else:
        await repo.create_buyer_profile(user.id, body.display_name)
    return await repo.get_by_id(user.id)


@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    return await repo.update_profile(user, body.model_dump(exclude_none=True))


@router.get("/artists/{artist_id}/profile", response_model=UserResponse)
async def get_artist_profile(artist_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID
    repo = UserRepository(db)
    user = await repo.get_by_id(UUID(artist_id))
    if not user or user.role != "artist":
        raise HTTPException(status_code=404, detail="Artist not found")
    return user