from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from core.database import get_db
from core.deps import get_current_user, CurrentUser
from repositories.artwork import FavoriteRepository, ArtworkRepository

router = APIRouter(prefix="/artworks", tags=["favorites"])

@router.post("/{artwork_id}/favorite")
async def toggle_favorite(
    artwork_id: UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    artwork_repo = ArtworkRepository(db)
    artwork = await artwork_repo.get_by_id(artwork_id)
    if not artwork or artwork.status not in ["published", "sold"]:
        raise HTTPException(status_code=404)
    fav_repo = FavoriteRepository(db)
    favorited = await fav_repo.toggle(user.id, artwork_id)
    return {"favorited": favorited}

@router.get("/me/favorites")
async def get_favorites(
    user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    from routers.artworks import _build_artwork_response
    fav_repo = FavoriteRepository(db)
    artworks = await fav_repo.list_by_user(user.id, skip=skip, limit=limit)
    return {
        "favorites": [_build_artwork_response(a) for a in artworks],
        "total": len(artworks)
    }