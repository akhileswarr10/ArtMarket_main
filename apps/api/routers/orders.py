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
    
    from routers.artworks import _generate_signed_url
    orders_data = []
    for o in orders:
        o_dict = {
            "id": o.id,
            "buyer_id": o.buyer_id,
            "status": o.status,
            "total_amount": o.total_amount,
            "currency": o.currency,
            "shipping_address": o.shipping_address,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
            "items": []
        }
        for item in o.items:
            item_data = {
                "id": item.id,
                "artwork_id": item.artwork_id,
                "artist_id": item.artist_id,
                "price_paid": item.price_paid,
                "title_snapshot": item.title_snapshot,
                "status": item.status,
                "artwork": None
            }
            if hasattr(item, "artwork") and item.artwork:
                images = []
                for img in item.artwork.images:
                    if img.is_confirmed:
                        images.append({
                            "signed_url": _generate_signed_url(img.storage_path),
                            "is_primary": img.is_primary
                        })
                item_data["artwork"] = {
                    "id": str(item.artwork.id),
                    "title": item.artwork.title,
                    "medium": item.artwork.medium,
                    "dimensions": item.artwork.dimensions,
                    "images": images
                }
            o_dict["items"].append(item_data)
        orders_data.append(o_dict)

    return {"orders": orders_data, "total": total}

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
    
    from routers.artworks import _generate_signed_url
    orders_data = []
    for o in orders:
        # Filter items to only include those belonging to the current artist
        artist_items = [item for item in o.items if item.artist_id == current_user.id]
        if not artist_items:
            continue
            
        artist_total = sum(float(item.price_paid or 0) for item in artist_items)
            
        o_dict = {
            "id": o.id,
            "buyer_id": o.buyer_id,
            "status": o.status,
            "total_amount": artist_total,
            "currency": o.currency,
            "shipping_address": o.shipping_address,
            "created_at": o.created_at,
            "updated_at": o.updated_at,
            "items": []
        }
        for item in artist_items:
            item_data = {
                "id": item.id,
                "artwork_id": item.artwork_id,
                "artist_id": item.artist_id,
                "price_paid": item.price_paid,
                "title_snapshot": item.title_snapshot,
                "status": item.status,
                "artwork": None
            }
            if hasattr(item, "artwork") and item.artwork:
                images = []
                for img in item.artwork.images:
                    if img.is_confirmed:
                        images.append({
                            "signed_url": _generate_signed_url(img.storage_path),
                            "is_primary": img.is_primary
                        })
                item_data["artwork"] = {
                    "id": str(item.artwork.id),
                    "title": item.artwork.title,
                    "medium": item.artwork.medium,
                    "dimensions": item.artwork.dimensions,
                    "images": images
                }
            o_dict["items"].append(item_data)
        orders_data.append(o_dict)

    return {"orders": orders_data, "total": total}

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
