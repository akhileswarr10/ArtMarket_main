import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from core.database import get_db
from core.deps import get_current_user, require_buyer, require_artist, require_admin
from models import User
from repositories.order import OrderRepository
from repositories.transaction import TransactionRepository
from services.notification_service import notify_order_cancelled, notify_refund
from services.audit_service import log
from schemas.order import OrderResponse, OrderListResponse, OrderCancelRequest

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("", response_model=OrderListResponse)
async def get_my_orders(
    current_user: Annotated[User, Depends(require_buyer)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    repo = OrderRepository(db)
    orders, total = await repo.get_by_buyer(current_user.id, skip=skip, limit=limit)
    return {"orders": orders, "total": total}

@router.get("/{id}", response_model=OrderResponse)
async def get_order(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    _is_buyer = order.buyer_id == current_user.id
    _is_admin = current_user.role == "admin"
    _is_artist = any(item.artist_id == current_user.id for item in order.items)
    
    if not (_is_buyer or _is_admin or _is_artist):
         raise HTTPException(status_code=403, detail="Not permitted")
         
    return order

@router.post("/{id}/cancel", response_model=OrderResponse)
async def cancel_order(
    id: uuid.UUID,
    cancel_in: OrderCancelRequest,
    current_user: Annotated[User, Depends(require_buyer)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = OrderRepository(db)
    try:
        order = await repo.cancel(id, current_user.id)
    except HTTPException as e:
        raise e
        
    await notify_order_cancelled(db, current_user.id, order.id)
    await log(db, current_user.id, "order.cancelled", "order", order.id, new_data={"reason": cancel_in.reason})
    return order

@router.get("/artist/sales", response_model=OrderListResponse)
async def get_artist_sales(
    current_user: Annotated[User, Depends(require_artist)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    repo = OrderRepository(db)
    orders, total = await repo.get_by_artist(current_user.id, skip=skip, limit=limit)
    return {"orders": orders, "total": total}

@router.get("/admin/all", response_model=OrderListResponse)
async def admin_get_all_orders(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = Query(None)
):
    repo = OrderRepository(db)
    orders, total = await repo.get_all(skip=skip, limit=limit, status=status)
    return {"orders": orders, "total": total}

@router.post("/admin/{id}/refund", response_model=OrderResponse)
async def admin_refund_order(
    id: uuid.UUID,
    refund_in: OrderCancelRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = OrderRepository(db)
    order = await repo.get_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status == "refunded":
        raise HTTPException(status_code=400, detail="Order is already refunded")
        
    order.status = "refunded"
    await db.commit()
    await db.refresh(order)
    
    tx_repo = TransactionRepository(db)
    await tx_repo.create(
        order_id=order.id,
        type="refund",
        amount=float(order.total_amount),
        currency=order.currency,
        status="succeeded"
    )
    
    await notify_refund(db, order.buyer_id, order.id, float(order.total_amount))
    await log(db, current_user.id, "order.refunded", "order", order.id, new_data={"reason": refund_in.reason})
    return order
