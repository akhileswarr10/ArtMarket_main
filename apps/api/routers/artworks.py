import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from core.database import get_db, AsyncSessionLocal
from core.deps import get_current_user, require_artist, get_current_user_optional, RequiredArtist
from models import User
from core.supabase import supabase_admin
from core.config import get_settings
from repositories.artwork import ArtworkRepository, ArtworkImageRepository
from schemas.artwork import (
    ArtworkCreate, ArtworkUpdate, ArtworkResponse, ArtworkListResponse,
    PresignedUrlResponse, ImageConfirmRequest, ArtworkImageResponse
)

router = APIRouter(prefix="/artworks", tags=["artworks"])
settings = get_settings()


def _build_image_response(image, signed_url: str = None) -> ArtworkImageResponse:
    return ArtworkImageResponse(
        id=image.id,
        storage_path=image.storage_path,
        signed_url=signed_url,
        is_primary=image.is_primary,
        display_order=image.display_order,
        width=image.width,
        height=image.height,
    )


def _generate_signed_url(storage_path: str) -> Optional[str]:
    try:
        result = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
            storage_path, expires_in=3600
        )
        return result.get("signedURL") or result.get("signedUrl")
    except Exception:
        return None


def _build_artwork_response(artwork) -> ArtworkResponse:
    confirmed_images = [img for img in artwork.images if img.is_confirmed]
    image_responses = []
    for img in confirmed_images:
        signed_url = _generate_signed_url(img.storage_path)
        image_responses.append(_build_image_response(img, signed_url))
    tags = [at.tag for at in artwork.artwork_tags]
    return ArtworkResponse(
        id=artwork.id,
        artist_id=artwork.artist_id,
        category_id=artwork.category_id,
        title=artwork.title,
        description=artwork.description,
        medium=artwork.medium,
        style=artwork.style,
        dimensions=artwork.dimensions,
        price=float(artwork.price) if artwork.price else None,
        status=artwork.status,
        view_count=artwork.view_count,
        images=image_responses,
        tags=tags,
        is_favorited=getattr(artwork, "is_favorited", False),
        created_at=artwork.created_at,
        updated_at=artwork.updated_at,
    )


async def _increment_views_background(artwork_id: uuid.UUID):
    """Runs in BackgroundTask — uses its own session."""
    async with AsyncSessionLocal() as db:
        repo = ArtworkRepository(db)
        await repo.increment_view_count(artwork_id)


@router.post("", response_model=ArtworkResponse, status_code=status.HTTP_201_CREATED)
async def create_artwork(
    body: ArtworkCreate,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    data = body.model_dump(exclude={"tag_ids"})
    artwork = await repo.create(artist_id=user.id, data=data, tag_ids=body.tag_ids)
    return _build_artwork_response(artwork)


@router.get("/mine", response_model=ArtworkListResponse)
async def get_my_artworks(
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("artist", "admin"):
        raise HTTPException(status_code=403)
    repo = ArtworkRepository(db)
    artworks, total = await repo.get_by_artist(user.id, status=status_filter, skip=skip, limit=limit)
    return ArtworkListResponse(
        artworks=[_build_artwork_response(a) for a in artworks],
        total=total, skip=skip, limit=limit,
    )


@router.get("", response_model=ArtworkListResponse)
async def list_artworks(
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[UUID] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    medium: Optional[str] = None,
    style: Optional[str] = None,
    search: Optional[str] = None,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    artworks, total = await repo.get_published(
        skip=skip, limit=limit, category_id=category_id,
        min_price=min_price, max_price=max_price,
        medium=medium, style=style, search=search,
        current_user_id=user.id if user else None
    )
    return ArtworkListResponse(
        artworks=[_build_artwork_response(a) for a in artworks],
        total=total, skip=skip, limit=limit,
    )


@router.get("/{artwork_id}", response_model=ArtworkResponse)
async def get_artwork(
    artwork_id: UUID,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    # NOTE: get_current_user is optional here — unauthenticated users can see published artworks
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    if artwork.status == "sold":
        # Check if user is buyer, artist, or admin
        is_buyer = False
        if user:
            from sqlalchemy import select
            from models import Order
            order_res = await db.execute(
                select(Order).where(Order.artwork_id == artwork.id, Order.buyer_id == user.id)
            )
            if order_res.scalar_one_or_none():
                is_buyer = True
        
        if not user or (str(artwork.artist_id) != str(user.id) and user.role != "admin" and not is_buyer):
            raise HTTPException(status_code=404, detail="Artwork not found")
            
        if not user or (str(artwork.artist_id) != str(user.id) and user.role != "admin"):
            raise HTTPException(status_code=404, detail="Artwork not found")
    
    # Check if favorited for current user
    if user:
        from repositories.artwork import FavoriteRepository
        fav_repo = FavoriteRepository(db)
        if await fav_repo.get(user.id, artwork.id):
            artwork.is_favorited = True
            
    background_tasks.add_task(_increment_views_background, artwork_id)
    return _build_artwork_response(artwork)


@router.patch("/{artwork_id}", response_model=ArtworkResponse)
async def update_artwork(
    artwork_id: UUID,
    body: ArtworkUpdate,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    data = body.model_dump(exclude={"tag_ids"}, exclude_none=True)
    return _build_artwork_response(await repo.update(artwork, data, tag_ids=body.tag_ids))


@router.delete("/{artwork_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artwork(
    artwork_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404)
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403)
    await repo.soft_delete(artwork)


@router.patch("/{artwork_id}/publish", response_model=ArtworkResponse)
async def publish_artwork(
    artwork_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404)
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403)
    if artwork.status != "draft":
        raise HTTPException(status_code=400, detail="Only drafts can be published")
    confirmed_images = [img for img in artwork.images if img.is_confirmed]
    if not confirmed_images:
        raise HTTPException(status_code=400, detail="Artwork must have at least one confirmed image")
    return _build_artwork_response(await repo.publish(artwork))


@router.post("/{artwork_id}/images/presign", response_model=PresignedUrlResponse)
async def presign_image_upload(
    artwork_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id, include_deleted=True)
    if not artwork:
        raise HTTPException(status_code=404)
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403)

    image_id = uuid.uuid4()
    storage_path = f"artworks/{artwork_id}/{image_id}-original.webp"

    # Create unconfirmed DB record BEFORE returning signed URL
    image_repo = ArtworkImageRepository(db)
    await image_repo.create({
        "id": image_id,
        "artwork_id": artwork_id,
        "storage_path": storage_path,
        "is_confirmed": False,
    })

    response = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_upload_url(storage_path)
    signed_url = response.get("signedURL") or response.get("signed_url", "")

    return PresignedUrlResponse(
        signed_url=signed_url,
        storage_path=storage_path,
        image_id=image_id,
    )


@router.post("/{artwork_id}/images/confirm", response_model=ArtworkImageResponse, status_code=status.HTTP_201_CREATED)
async def confirm_image_upload(
    artwork_id: UUID,
    body: ImageConfirmRequest,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    image_repo = ArtworkImageRepository(db)
    image = await image_repo.confirm(body.image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    signed_url = _generate_signed_url(image.storage_path)
    return _build_image_response(image, signed_url)


@router.delete("/{artwork_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    artwork_id: UUID,
    image_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    image_repo = ArtworkImageRepository(db)
    deleted = await image_repo.delete(image_id)
    if not deleted:
        raise HTTPException(status_code=404)