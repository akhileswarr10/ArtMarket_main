import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from models import Cart, CartItem, Artwork

class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, buyer_id: uuid.UUID) -> Cart:
        # Eager load items and artworks to avoid lazy-loading crashes
        stmt = select(Cart).options(
            selectinload(Cart.items).selectinload(CartItem.artwork)
        ).where(Cart.buyer_id == buyer_id)
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()
        
        if not cart:
            cart = Cart(buyer_id=buyer_id)
            self.db.add(cart)
            await self.db.commit()
            # Re-fetch with full options to ensure stable object state
            return await self.get_or_create(buyer_id)
        return cart

    async def add_item(self, cart_id: uuid.UUID, artwork_id: uuid.UUID) -> CartItem:
        stmt = select(Artwork).where(Artwork.id == artwork_id)
        result = await self.db.execute(stmt)
        artwork = result.scalar_one_or_none()
        
        if not artwork:
            raise HTTPException(status_code=404, detail="Artwork not found")
        if artwork.status != "published":
            raise HTTPException(status_code=400, detail="Artwork is not available for purchase")

        stmt = select(CartItem).where(CartItem.cart_id == cart_id, CartItem.artwork_id == artwork_id)
        existing = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Artwork already in cart")

        item = CartItem(cart_id=cart_id, artwork_id=artwork_id, price_at_add=artwork.price)
        self.db.add(item)
        await self.db.commit()
        
        # Re-fetch with eager loading to avoid lazy-loading issues
        stmt = select(CartItem).options(selectinload(CartItem.artwork)).where(CartItem.id == item.id)
        return (await self.db.execute(stmt)).scalar_one()

    async def remove_item(self, cart_id: uuid.UUID, artwork_id: uuid.UUID) -> bool:
        stmt = delete(CartItem).where(CartItem.cart_id == cart_id, CartItem.artwork_id == artwork_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def get_cart_with_items(self, buyer_id: uuid.UUID) -> Cart:
        # Use get_or_create which already eager loads everything
        return await self.get_or_create(buyer_id)

    async def remove_sold_items(self, artwork_ids: list[uuid.UUID]) -> int:
        if not artwork_ids:
            return 0
        stmt = delete(CartItem).where(CartItem.artwork_id.in_(artwork_ids))
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
