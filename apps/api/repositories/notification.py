import uuid
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from typing import List, Optional


from models import Notification

class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: uuid.UUID, type: str, title: str, body: str, metadata: Optional[dict] = None) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            metadata_data=metadata
        )
        self.db.add(notification)
        await self.db.commit()
        # Return without refresh to avoid lazy-loading issues; 
        # the caller can re-fetch if they need relations.
        return notification

    async def get_for_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 50, unread_first: bool = True) -> Tuple[List[Notification], int]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_first:
            stmt = stmt.order_by(Notification.is_read.asc(), Notification.created_at.desc())
        else:
            stmt = stmt.order_by(Notification.created_at.desc())
            
        stmt = stmt.offset(skip).limit(limit)
        count_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)
        
        notifications = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar() or 0
        return list(notifications), total

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id, Notification.is_read == False)
        return (await self.db.execute(stmt)).scalar() or 0

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        notification = (await self.db.execute(stmt)).scalar_one_or_none()
        if notification:
            notification.is_read = True
            await self.db.commit()
        return notification

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        stmt = update(Notification).where(Notification.user_id == user_id, Notification.is_read == False).values(is_read=True)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
    async def get_for_user(self, user_id: uuid.UUID, unread_only: bool = False) -> List[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        stmt = stmt.order_by(Notification.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        stmt = select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
        result = await self.db.execute(stmt)
        notification = result.scalar_one_or_none()
        if notification:
            notification.is_read = True
            await self.db.commit()
            await self.db.refresh(notification)
        return notification
