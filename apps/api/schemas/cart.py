from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class CartItemAdd(BaseModel):
    artwork_id: UUID

class ArtworkSnap(BaseModel):
    id: UUID
    title: Optional[str] = None
    price: Optional[float] = None
    status: str
    artist_id: UUID

class CartItemResponse(BaseModel):
    id: UUID
    cart_id: UUID
    artwork_id: UUID
    price_at_add: float
    added_at: datetime
    artwork: ArtworkSnap

    model_config = ConfigDict(from_attributes=True)

class CartResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    items: List[CartItemResponse]
    total: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
