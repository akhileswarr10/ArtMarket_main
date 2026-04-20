import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from core.database import get_db
from core.deps import get_current_user
from models import User
from repositories.cart import CartRepository
from schemas.cart import CartResponse, CartItemResponse, CartItemAdd

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = CartRepository(db)
    cart = await repo.get_cart_with_items(current_user.id)
    return cart

@router.post("/items", response_model=CartItemResponse)
async def add_item_to_cart(
    item_in: CartItemAdd,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = CartRepository(db)
    cart = await repo.get_or_create(current_user.id)
    item = await repo.add_item(cart.id, item_in.artwork_id)
    return item

@router.delete("/items/{artwork_id}")
async def remove_item_from_cart(
    artwork_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = CartRepository(db)
    cart = await repo.get_or_create(current_user.id)
    removed = await repo.remove_item(cart.id, artwork_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return {"status": "success"}
