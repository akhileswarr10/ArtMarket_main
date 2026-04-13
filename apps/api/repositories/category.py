from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid
from datetime import datetime

from models import Category, Tag, ArtworkTag
from schemas.user import CategoryCreate, TagCreate


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: uuid.UUID) -> Optional[Category]:
        result = await self.db.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        result = await self.db.execute(
            select(Category).where(Category.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> List[Category]:
        result = await self.db.execute(
            select(Category).order_by(Category.name)
        )
        return list(result.scalars().all())

    async def create(self, category_data: CategoryCreate) -> Category:
        category = Category(**category_data.model_dump())
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def update(self, category_id: uuid.UUID, data: dict) -> Optional[Category]:
        category = await self.get_by_id(category_id)
        if not category:
            return None
        
        for key, value in data.items():
            setattr(category, key, value)
        
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete(self, category_id: uuid.UUID) -> bool:
        category = await self.get_by_id(category_id)
        if not category:
            return False
        
        await self.db.delete(category)
        await self.db.commit()
        return True


class TagRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tag_id: uuid.UUID) -> Optional[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.id == tag_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> List[Tag]:
        result = await self.db.execute(
            select(Tag).order_by(Tag.name)
        )
        return list(result.scalars().all())

    async def create(self, tag_data: TagCreate) -> Tag:
        tag = Tag(**tag_data.model_dump())
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        return tag

    async def delete(self, tag_id: uuid.UUID) -> bool:
        tag = await self.get_by_id(tag_id)
        if not tag:
            return False
        
        await self.db.delete(tag)
        await self.db.commit()
        return True

    async def get_by_artwork(self, artwork_id: uuid.UUID) -> List[Tag]:
        result = await self.db.execute(
            select(Tag)
            .join(ArtworkTag)
            .where(ArtworkTag.artwork_id == artwork_id)
        )
        return list(result.scalars().all())