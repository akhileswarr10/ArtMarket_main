import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional

from models import User, ArtistProfile, BuyerProfile


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.artist_profile), selectinload(User.buyer_profile))
            .where(User.id == user_id)
            .where(User.deleted_at == None)
        )
        return result.scalar_one_or_none()

    async def get_by_supabase_id(self, supabase_user_id: uuid.UUID) -> Optional[User]:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.artist_profile), selectinload(User.buyer_profile))
            .where(User.supabase_user_id == supabase_user_id)
        )
        return result.scalar_one_or_none()

    async def create_from_jwt(self, supabase_user_id: uuid.UUID, email: str) -> User:
        """Lazy user creation on first authenticated request."""
        user = User(supabase_user_id=supabase_user_id, email=email, role=None)
        self.db.add(user)
        await self.db.commit()
        # Re-fetch with eager loads  
        return await self.get_by_supabase_id(supabase_user_id)

    async def set_role(self, user: User, role: str) -> User:
        user.role = role
        await self.db.commit()
        return await self.get_by_id(user.id)

    async def create_artist_profile(self, user_id: uuid.UUID, display_name: str, bio: str = None, website_url: str = None) -> ArtistProfile:
        profile = ArtistProfile(user_id=user_id, display_name=display_name, bio=bio, website_url=website_url)
        self.db.add(profile)
        await self.db.commit()
        return profile

    async def create_buyer_profile(self, user_id: uuid.UUID, display_name: str) -> BuyerProfile:
        profile = BuyerProfile(user_id=user_id, display_name=display_name)
        self.db.add(profile)
        await self.db.commit()
        return profile

    async def update_profile(self, user: User, updates: dict) -> User:
        if user.role == "artist" and user.artist_profile:
            for key, val in updates.items():
                if val is not None and hasattr(user.artist_profile, key):
                    setattr(user.artist_profile, key, val)
        elif user.role == "buyer" and user.buyer_profile:
            # Map 'address' to 'shipping_address' for buyer consistency in frontend
            if "address" in updates and updates["address"] is not None:
                updates["shipping_address"] = updates.pop("address")
                
            for key, val in updates.items():
                if val is not None and hasattr(user.buyer_profile, key):
                    setattr(user.buyer_profile, key, val)
        await self.db.commit()
        return await self.get_by_id(user.id)

    async def list_all(self, skip: int = 0, limit: int = 50, role: str = None) -> tuple[list[User], int]:
        from sqlalchemy import func as sqlfunc
        query = select(User).options(selectinload(User.artist_profile), selectinload(User.buyer_profile))
        count_query = select(sqlfunc.count()).select_from(User)
        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)
        total = (await self.db.execute(count_query)).scalar()
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().unique().all(), total