import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from core.database import get_db
from core.deps import get_current_user, require_buyer
from core.config import get_settings
from models import User
from repositories.cart import CartRepository
from repositories.order import OrderRepository
from repositories.transaction import TransactionRepository
from services.notification_service import notify_purchase_buyer, notify_sale_artist
from services.audit_service import log
from services.tasks import remove_sold_artworks_from_carts
from schemas.checkout import CheckoutSessionResponse, CheckoutRequest

router = APIRouter(prefix="/checkout", tags=["checkout"])
settings = get_settings()

@router.post("/session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_in: CheckoutRequest,
    current_user: Annotated[User, Depends(require_buyer)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")
        
    order_repo = OrderRepository(db)
    cancelled_count = await order_repo.count_cancelled_in_window(current_user.id, settings.CART_MAX_CANCELLED_ORDERS_DAYS)
    if cancelled_count >= settings.CART_MAX_CANCELLED_ORDERS_COUNT:
        raise HTTPException(status_code=403, detail="Too many cancelled orders recently")

    cart_repo = CartRepository(db)
    cart = await cart_repo.get_cart_with_items(current_user.id)
    
    if not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum([float(item.artwork.price or 0) for item in cart.items])
    if total > settings.MAX_ORDER_VALUE:
        raise HTTPException(status_code=400, detail=f"Order total exceeds allowable maximum of {settings.MAX_ORDER_VALUE}")

    order = await order_repo.create_from_cart(
        buyer_id=current_user.id,
        cart=cart,
        shipping_address=checkout_in.shipping_address.model_dump()
    )

    return {"checkout_url": f"/checkout/confirm?order_id={order.id}", "order_id": order.id}

@router.post("/confirm/{order_id}")
async def confirm_checkout_dummy(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_buyer)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    order_repo = OrderRepository(db)
    order = await order_repo.get_by_id(order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.status == "paid":
        return {"status": "success", "message": "Already paid"}

    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Order cannot be paid")

    order.status = "paid"
    
    tx_repo = TransactionRepository(db)
    await tx_repo.create(
        order_id=order.id,
        type="charge",
        amount=float(order.total_amount),
        currency=order.currency,
        status="succeeded"
    )

    artwork_ids = []
    artwork_titles = []
    for item in order.items:
        artwork_ids.append(str(item.artwork_id))
        artwork_titles.append(item.title_snapshot)
        await notify_sale_artist(db, item.artist_id, order.id, item.title_snapshot)
        
    await notify_purchase_buyer(db, current_user.id, order.id, artwork_titles)
    await log(db, current_user.id, "order.paid", "order", order.id)

    cart_repo = CartRepository(db)
    cart = await cart_repo.get_or_create(current_user.id)
    for aid in artwork_ids:
        await cart_repo.remove_item(cart.id, uuid.UUID(aid))

    remove_sold_artworks_from_carts(artwork_ids)

    return {"status": "success", "order_id": order.id}
