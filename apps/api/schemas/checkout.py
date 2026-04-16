from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class ShippingAddress(BaseModel):
    line1: str
    city: str
    state: str
    zip: str
    country: str

class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress

class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    order_id: UUID
