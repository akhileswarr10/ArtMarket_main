from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    body: str
    is_read: bool
    metadata_data: Optional[dict] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int

class UnreadCountResponse(BaseModel):
    count: int
