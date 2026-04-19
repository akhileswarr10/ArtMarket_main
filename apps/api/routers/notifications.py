from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID

from core.database import get_db
from core.deps import get_current_user
from models import Notification, User
from schemas.notification import NotificationResponse, NotificationListResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())
    if unread_only:
        stmt = stmt.where(Notification.is_read == False)
    
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    
    return NotificationListResponse(notifications=list(notifications))

@router.patch("/{notification_id}/read")
async def read_notification(
    notification_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notification = await db.get(Notification, notification_id)
    if not notification or str(notification.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    await db.commit()
    return {"ok": True}

@router.patch("/read-all")
async def read_all_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = update(Notification).where(
        Notification.user_id == user.id,
        Notification.is_read == False
    ).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"ok": True}
