from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models import Category
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/categories", tags=["categories"])

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    model_config = {"from_attributes": True}

@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()