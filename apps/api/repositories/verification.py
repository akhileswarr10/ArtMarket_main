import uuid
from typing import List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import ArtistProfile
from fastapi import HTTPException

class VerificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def apply(self, artist_id: uuid.UUID) -> ArtistProfile:
        stmt = select(ArtistProfile).where(ArtistProfile.user_id == artist_id)
        profile = (await self.db.execute(stmt)).scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Artist profile not found")
        if profile.verification_status in ["pending", "verified"]:
            raise HTTPException(status_code=409, detail=f"Already {profile.verification_status}")

        profile.verification_status = "pending"
        profile.verification_submitted_at = datetime.now(timezone.utc)
        await self.db.commit()
        return profile

    async def approve(self, artist_id: uuid.UUID) -> ArtistProfile:
        stmt = select(ArtistProfile).where(ArtistProfile.user_id == artist_id)
        profile = (await self.db.execute(stmt)).scalar_one_or_none()
        if profile:
            profile.verification_status = "verified"
            profile.is_verified = True
            await self.db.commit()
        return profile

    async def reject(self, artist_id: uuid.UUID, reason: str) -> ArtistProfile:
        stmt = select(ArtistProfile).where(ArtistProfile.user_id == artist_id)
        profile = (await self.db.execute(stmt)).scalar_one_or_none()
        if profile:
            profile.verification_status = "unverified"
            profile.verification_notes = reason
            profile.is_verified = False
            await self.db.commit()
        return profile

    async def get_queue(self) -> List[ArtistProfile]:
        stmt = select(ArtistProfile).where(ArtistProfile.verification_status == "pending").order_by(ArtistProfile.verification_submitted_at.asc())
        return list((await self.db.execute(stmt)).scalars().all())
