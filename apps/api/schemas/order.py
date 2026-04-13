from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from .artwork import ArtworkResponse

class OrderCreate(BaseModel):
    artwork_id: UUID
    amount: float
    shipping_details: Optional[dict] = None

class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    artwork_id: UUID
    amount: float
    status: str
    shipping_details: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    artwork: Optional[ArtworkResponse] = None

    model_config = {"from_attributes": True}

class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
