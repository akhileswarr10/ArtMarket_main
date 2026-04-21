import uuid
from typing import List, Tuple, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from models import Order, OrderItem, Artwork, Cart

class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_from_cart(self, buyer_id: uuid.UUID, cart: Cart, shipping_address: dict) -> Order:
        if not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # cart.items is already eager loaded by now
        total_amount = 0
        order_items = []
        
        for item in cart.items:
            artwork = item.artwork
            if not artwork or artwork.status != "published":
                raise HTTPException(status_code=400, detail=f"Artwork {item.artwork_id} is no longer available")
            
            total_amount += float(artwork.price or 0)
            
            order_items.append(OrderItem(
                artwork_id=artwork.id,
                artist_id=artwork.artist_id,
                price_paid=artwork.price,
                title_snapshot=artwork.title or "Untitled",
            ))
            artwork.status = "sold"

        order = Order(
            buyer_id=buyer_id,
            status="pending",
            total_amount=total_amount,
            currency="USD",
            shipping_address=shipping_address
        )
        self.db.add(order)
        await self.db.flush()
        
        for oi in order_items:
            oi.order_id = order.id
            self.db.add(oi)

        await self.db.commit()
        return await self.get_by_id(order.id)

    async def get_by_id(self, order_id: uuid.UUID, buyer_id: Optional[uuid.UUID] = None) -> Optional[Order]:
        stmt = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        if buyer_id:
            stmt = stmt.where(Order.buyer_id == buyer_id)
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_by_buyer(self, buyer_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[Order], int]:
        stmt = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.artwork).selectinload(Artwork.images)
        ).where(Order.buyer_id == buyer_id).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        count_stmt = select(func.count()).select_from(Order).where(Order.buyer_id == buyer_id)
        
        orders = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar()
        return list(orders), total

    async def get_by_artist(self, artist_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[Order], int]:
        stmt = (
            select(Order)
            .join(Order.items)
            .options(
                selectinload(Order.items).selectinload(OrderItem.artwork).selectinload(Artwork.images)
            )
            .where(OrderItem.artist_id == artist_id)
            .order_by(Order.created_at.desc())
            .distinct()
            .offset(skip).limit(limit)
        )
        count_stmt = (
            select(func.count(func.distinct(Order.id)))
            .join(Order.items)
            .where(OrderItem.artist_id == artist_id)
        )
        orders = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar()
        return list(orders), total

    async def get_all(self, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> Tuple[List[Order], int]:
        stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
        count_stmt = select(func.count()).select_from(Order)
        if status:
            stmt = stmt.where(Order.status == status)
            count_stmt = count_stmt.where(Order.status == status)
            
        stmt = stmt.offset(skip).limit(limit)
        orders = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar()
        return list(orders), total

    async def cancel(self, order_id: uuid.UUID, buyer_id: uuid.UUID) -> Order:
        order = await self.get_by_id(order_id, buyer_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.status != "pending":
            raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
            
        order.status = "cancelled"
        
        for item in order.items:
            artwork = (await self.db.execute(select(Artwork).where(Artwork.id == item.artwork_id))).scalar_one_or_none()
            if artwork and artwork.status == "sold":
                artwork.status = "published"
                
        await self.db.commit()
        return await self.get_by_id(order.id)

    async def count_cancelled_in_window(self, buyer_id: uuid.UUID, days: int = 7) -> int:
        threshold = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = select(func.count()).select_from(Order).where(
            Order.buyer_id == buyer_id,
            Order.status == "cancelled",
            Order.created_at >= threshold
        )
        return (await self.db.execute(stmt)).scalar() or 0
