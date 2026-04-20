import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.deps import get_current_user
from models import User
from repositories.notification import NotificationRepository
from schemas.notification import (
    NotificationResponse, 
    NotificationListResponse, 
    UnreadCountResponse
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    repo = NotificationRepository(db)
    notifications, total = await repo.get_for_user(current_user.id, skip=skip, limit=limit)
    return {"notifications": notifications, "total": total}

@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = NotificationRepository(db)
    count = await repo.get_unread_count(current_user.id)
    return {"count": count}

@router.patch("/{id}/read", response_model=NotificationResponse)
async def mark_read(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = NotificationRepository(db)
    notification = await repo.mark_read(id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.patch("/read-all")
async def mark_all_read(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = NotificationRepository(db)
    updated = await repo.mark_all_read(current_user.id)
    return {"status": "success", "updated": updated}
