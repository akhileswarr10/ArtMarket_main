from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ArtistProfileResponse(BaseModel):
    id: UUID
    display_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    website_url: Optional[str] = None
    is_verified: bool
    address: Optional[dict] = None

    model_config = {"from_attributes": True}


class BuyerProfileResponse(BaseModel):
    id: UUID
    display_name: str
    avatar_url: Optional[str] = None
    shipping_address: Optional[dict] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: Optional[str] = None
    is_active: bool
    artist_profile: Optional[ArtistProfileResponse] = None
    buyer_profile: Optional[BuyerProfileResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OnboardRequest(BaseModel):
    role: str   # "artist" | "buyer"
    display_name: str
    bio: Optional[str] = None
    website_url: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    website_url: Optional[str] = None
    shipping_address: Optional[dict] = None
    address: Optional[dict] = None