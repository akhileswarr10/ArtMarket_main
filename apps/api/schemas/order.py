from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import List, Optional
from datetime import datetime


class ArtworkImageInOrderResponse(BaseModel):
    """Slim image shape returned by the orders query (only signed_url + is_primary)."""
    signed_url: Optional[str] = None
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ArtworkInOrderResponse(BaseModel):
    """Slim artwork shape embedded in order items — only the fields the orders router returns."""
    id: UUID
    title: Optional[str] = None
    medium: Optional[str] = None
    dimensions: Optional[str] = None
    images: List[ArtworkImageInOrderResponse] = []

    model_config = ConfigDict(from_attributes=True)

class OrderItemResponse(BaseModel):
    id: UUID
    artwork_id: UUID
    artist_id: UUID
    price_paid: float
    title_snapshot: str
    status: str
    artwork: Optional[ArtworkInOrderResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    status: str
    total_amount: float
    currency: str
    shipping_address: Optional[dict] = None
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int

class OrderCancelRequest(BaseModel):
    reason: Optional[str] = None
