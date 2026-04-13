from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from core.database import get_db
from core.deps import get_current_user
from models import User
from repositories.order import OrderRepository
from schemas.order import OrderCreate, OrderResponse, OrderListResponse

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = OrderRepository(db)
    order = await repo.create(
        buyer_id=current_user.id,
        artwork_id=order_in.artwork_id,
        amount=order_in.amount,
        shipping_details=order_in.shipping_details
    )
    return order

@router.get("/mine", response_model=OrderListResponse)
async def get_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    repo = OrderRepository(db)
    orders, total = await repo.get_by_buyer(current_user.id, skip=skip, limit=limit)
    return {"orders": orders, "total": total}
