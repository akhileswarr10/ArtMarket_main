import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List

from models import Order, Artwork, User


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, buyer_id: uuid.UUID, artwork_id: uuid.UUID, amount: float, shipping_details: dict = None) -> Order:
        order = Order(
            buyer_id=buyer_id,
            artwork_id=artwork_id,
            amount=amount,
            shipping_details=shipping_details,
            status="paid"  # Direct purchase for now
        )
        self.db.add(order)
        
        # Also mark artwork as sold
        result = await self.db.execute(select(Artwork).where(Artwork.id == artwork_id))
        artwork = result.scalar_one_or_none()
        if artwork:
            artwork.status = "sold"
            
        await self.db.commit()
        await self.db.refresh(order)
        return await self.get_by_id(order.id)

    async def get_by_id(self, order_id: uuid.UUID) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.artwork).selectinload(Artwork.images))
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_buyer(self, buyer_id: uuid.UUID, skip: int = 0, limit: int = 50) -> tuple[List[Order], int]:
        query = (
            select(Order)
            .options(selectinload(Order.artwork).selectinload(Artwork.images))
            .where(Order.buyer_id == buyer_id)
            .order_by(Order.created_at.desc())
        )
        
        count_query = select(func.count()).select_from(Order).where(Order.buyer_id == buyer_id)
        total = (await self.db.execute(count_query)).scalar()
        
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().all(), total
