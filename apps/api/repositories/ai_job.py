import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import AIJob

class AIJobRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_artwork(self, artwork_id: uuid.UUID) -> List[AIJob]:
        stmt = select(AIJob).where(AIJob.artwork_id == artwork_id).order_by(AIJob.created_at.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all(self, limit: int = 100) -> List[AIJob]:
        stmt = select(AIJob).order_by(AIJob.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
