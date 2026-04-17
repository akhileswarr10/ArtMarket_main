import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Notification

class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

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
