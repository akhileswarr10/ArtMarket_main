from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class ArtworkImageResponse(BaseModel):
    id: UUID
    storage_path: str
    signed_url: Optional[str] = None   # generated per-request, never stored
    is_primary: bool
    display_order: int
    width: Optional[int] = None
    height: Optional[int] = None

    model_config = {"from_attributes": True}


class TagResponse(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ArtworkResponse(BaseModel):
    id: UUID
    artist_id: UUID
    category_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    medium: Optional[str] = None
    style: Optional[str] = None
    dimensions: Optional[str] = None
    price: Optional[float] = None
    status: str
    view_count: int
    images: List[ArtworkImageResponse] = []
    tags: List[TagResponse] = []
    is_favorited: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ArtworkCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    medium: Optional[str] = None
    style: Optional[str] = None
    dimensions: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[UUID] = None
    tag_ids: List[UUID] = []


class ArtworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    medium: Optional[str] = None
    style: Optional[str] = None
    dimensions: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[UUID] = None
    tag_ids: Optional[List[UUID]] = None


class ImageConfirmRequest(BaseModel):
    image_id: UUID


class PresignedUrlResponse(BaseModel):
    signed_url: str
    storage_path: str
    image_id: UUID


class ArtworkListResponse(BaseModel):
    artworks: List[ArtworkResponse]
    total: int
    skip: int
    limit: int