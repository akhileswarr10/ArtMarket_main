import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple

from models import Artwork, ArtworkImage, ArtworkTag, Tag, Favorite, User


class ArtworkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _base_query_with_relations(self):
        return select(Artwork).options(
            selectinload(Artwork.images),
            selectinload(Artwork.artwork_tags).selectinload(ArtworkTag.tag),
            selectinload(Artwork.artist).selectinload(User.artist_profile),
        )

    async def get_by_id(self, artwork_id: uuid.UUID, include_deleted: bool = False) -> Optional[Artwork]:
        query = self._base_query_with_relations().where(Artwork.id == artwork_id)
        if not include_deleted:
            query = query.where(Artwork.deleted_at == None)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_artist(self, artist_id: uuid.UUID, status: str = None, skip: int = 0, limit: int = 20) -> Tuple[List[Artwork], int]:
        query = self._base_query_with_relations().where(
            Artwork.deleted_at == None
        )
        if artist_id:
            query = query.where(Artwork.artist_id == artist_id)
        if status:
            query = query.where(Artwork.status == status)
        
        count_query = select(func.count()).select_from(Artwork).where(Artwork.deleted_at == None)
        if artist_id:
            count_query = count_query.where(Artwork.artist_id == artist_id)
        if status:
            count_query = count_query.where(Artwork.status == status)
            
        count = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().unique().all(), count

    async def get_published(self, skip: int = 0, limit: int = 20, category_id: uuid.UUID = None,
                             min_price: float = None, max_price: float = None,
                             medium: str = None, style: str = None, search: str = None,
                             tag_name: str = None,
                             current_user_id: uuid.UUID = None) -> Tuple[List[Artwork], int]:
        query = self._base_query_with_relations().where(
            Artwork.status == "published",
            Artwork.deleted_at == None
        )
        count_query = select(func.count()).select_from(Artwork).where(
            Artwork.status == "published", Artwork.deleted_at == None
        )
        if category_id:
            query = query.where(Artwork.category_id == category_id)
            count_query = count_query.where(Artwork.category_id == category_id)
        if min_price is not None:
            query = query.where(Artwork.price >= min_price)
            count_query = count_query.where(Artwork.price >= min_price)
        if max_price is not None:
            query = query.where(Artwork.price <= max_price)
            count_query = count_query.where(Artwork.price <= max_price)
        if medium:
            query = query.where(Artwork.medium.ilike(f"%{medium}%"))
            count_query = count_query.where(Artwork.medium.ilike(f"%{medium}%"))
        if style:
            query = query.where(Artwork.style.ilike(f"%{style}%"))
            count_query = count_query.where(Artwork.style.ilike(f"%{style}%"))
        if search:
            from sqlalchemy import func as sqlfunc
            tsquery = sqlfunc.plainto_tsquery("english", search)
            query = query.where(Artwork.search_vector.op("@@")(tsquery))
            count_query = count_query.where(Artwork.search_vector.op("@@")(tsquery))
        if tag_name:
            query = query.join(ArtworkTag, ArtworkTag.artwork_id == Artwork.id)\
                         .join(Tag, Tag.id == ArtworkTag.tag_id)\
                         .where(Tag.name.ilike(f"%{tag_name}%"))
            count_query = count_query.join(ArtworkTag, ArtworkTag.artwork_id == Artwork.id)\
                                     .join(Tag, Tag.id == ArtworkTag.tag_id)\
                                     .where(Tag.name.ilike(f"%{tag_name}%"))
        
        total = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.order_by(Artwork.created_at.desc()).offset(skip).limit(limit))
        artworks = result.scalars().unique().all()

        # If user is logged in, check which artworks are favorited
        if current_user_id and artworks:
            artwork_ids = [a.id for a in artworks]
            fav_result = await self.db.execute(
                select(Favorite.artwork_id).where(
                    Favorite.user_id == current_user_id,
                    Favorite.artwork_id.in_(artwork_ids)
                )
            )
            favorited_ids = set(fav_result.scalars().all())
            for a in artworks:
                # We can't set an attribute on the model that isn't in __dict__ easily without SQLAlchemy complaining,
                # but since we're using Pydantic for response, we can set a transient attribute.
                a.is_favorited = a.id in favorited_ids

        return artworks, total

    async def create(self, artist_id: uuid.UUID, data: dict, tag_ids: List[uuid.UUID] = None) -> Artwork:
        artwork = Artwork(artist_id=artist_id, **data)
        self.db.add(artwork)
        await self.db.flush()  # Get ID before commit
        if tag_ids:
            for tag_id in tag_ids:
                self.db.add(ArtworkTag(artwork_id=artwork.id, tag_id=tag_id))
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def update(self, artwork: Artwork, data: dict, tag_ids: List[uuid.UUID] = None) -> Artwork:
        for key, val in data.items():
            if val is not None:
                setattr(artwork, key, val)
        if tag_ids is not None:
            # Replace all tags
            await self.db.execute(
                ArtworkTag.__table__.delete().where(ArtworkTag.artwork_id == artwork.id)
            )
            for tag_id in tag_ids:
                self.db.add(ArtworkTag(artwork_id=artwork.id, tag_id=tag_id))
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def soft_delete(self, artwork: Artwork) -> None:
        from datetime import datetime
        artwork.deleted_at = datetime.utcnow()
        await self.db.commit()

    async def publish(self, artwork: Artwork) -> Artwork:
        artwork.status = "published"
        await self.db.commit()
        return await self.get_by_id(artwork.id)

    async def increment_view_count(self, artwork_id: uuid.UUID) -> None:
        """Called from BackgroundTask — gets its own session via dependency."""
        await self.db.execute(
            update(Artwork)
            .where(Artwork.id == artwork_id)
            .values(view_count=Artwork.view_count + 1)
        )
        await self.db.commit()


class ArtworkImageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, image_id: uuid.UUID) -> Optional[ArtworkImage]:
        result = await self.db.execute(
            select(ArtworkImage).where(ArtworkImage.id == image_id)
        )
        return result.scalar_one_or_none()

    async def create(self, image_data: dict) -> ArtworkImage:
        image = ArtworkImage(**image_data)
        self.db.add(image)
        await self.db.commit()
        return image

    async def confirm(self, image_id: uuid.UUID) -> Optional[ArtworkImage]:
        image = await self.get_by_id(image_id)
        if not image:
            return None
        image.is_confirmed = True
        # Set as primary if it's the first confirmed image
        existing = await self.db.execute(
            select(ArtworkImage).where(
                ArtworkImage.artwork_id == image.artwork_id,
                ArtworkImage.is_primary == True,
                ArtworkImage.is_confirmed == True,
            )
        )
        if not existing.scalar_one_or_none():
            image.is_primary = True
        await self.db.commit()
        return image

    async def delete(self, image_id: uuid.UUID) -> bool:
        image = await self.get_by_id(image_id)
        if not image:
            return False
        await self.db.delete(image)
        await self.db.commit()
        return True


class FavoriteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: uuid.UUID, artwork_id: uuid.UUID) -> Optional[Favorite]:
        result = await self.db.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.artwork_id == artwork_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20):
        # We join with Artwork to get details
        result = await self.db.execute(
            select(Artwork)
            .join(Favorite, Favorite.artwork_id == Artwork.id)
            .where(Favorite.user_id == user_id)
            .options(
                selectinload(Artwork.images),
                selectinload(Artwork.artwork_tags).selectinload(ArtworkTag.tag),
                selectinload(Artwork.artist).selectinload(User.artist_profile),
            )
            .offset(skip).limit(limit)
        )
        artworks = result.scalars().unique().all()
        # Ensure is_favorited is True for all these
        for a in artworks:
            a.is_favorited = True
        return artworks

    async def toggle(self, user_id: uuid.UUID, artwork_id: uuid.UUID) -> bool:
        """Returns True if favorited, False if unfavorited."""
        existing = await self.get(user_id, artwork_id)
        if existing:
            await self.db.delete(existing)
            await self.db.commit()
            return False
        else:
            self.db.add(Favorite(user_id=user_id, artwork_id=artwork_id))
            await self.db.commit()
            return True