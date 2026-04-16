import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from repositories.notification import NotificationRepository

async def notify_purchase_buyer(db: AsyncSession, buyer_id: uuid.UUID, order_id: uuid.UUID, artwork_titles: list[str]):
    repo = NotificationRepository(db)
    title = "Order Confirmed!"
    body = f"Your order containing '{', '.join(artwork_titles)}' has been confirmed."
    await repo.create(
        user_id=buyer_id,
        type="order_confirmed",
        title=title,
        body=body,
        metadata={"order_id": str(order_id)}
    )

async def notify_sale_artist(db: AsyncSession, artist_id: uuid.UUID, order_id: uuid.UUID, artwork_title: str):
    repo = NotificationRepository(db)
    title = "You made a sale!"
    body = f"Your artwork '{artwork_title}' was just purchased."
    await repo.create(
        user_id=artist_id,
        type="artwork_sold",
        title=title,
        body=body,
        metadata={"order_id": str(order_id)}
    )

async def notify_order_cancelled(db: AsyncSession, buyer_id: uuid.UUID, order_id: uuid.UUID):
    repo = NotificationRepository(db)
    title = "Order Cancelled"
    body = f"Your order has been successfully cancelled."
    await repo.create(
        user_id=buyer_id,
        type="order_cancelled",
        title=title,
        body=body,
        metadata={"order_id": str(order_id)}
    )

async def notify_refund(db: AsyncSession, buyer_id: uuid.UUID, order_id: uuid.UUID, amount: float):
    repo = NotificationRepository(db)
    title = "Refund Processed"
    body = f"A refund of ${amount:,.2f} has been processed for your order."
    await repo.create(
        user_id=buyer_id,
        type="order_refunded",
        title=title,
        body=body,
        metadata={"order_id": str(order_id), "amount": amount}
    )

async def notify_verification_approved(db: AsyncSession, artist_id: uuid.UUID):
    repo = NotificationRepository(db)
    title = "Verification Approved!"
    body = "Congratulations, your artist profile has been verified."
    await repo.create(
        user_id=artist_id,
        type="verification_approved",
        title=title,
        body=body
    )

async def notify_verification_rejected(db: AsyncSession, artist_id: uuid.UUID, reason: str):
    repo = NotificationRepository(db)
    title = "Verification Update"
    body = f"Your verification application was not approved: {reason}"
    await repo.create(
        user_id=artist_id,
        type="verification_rejected",
        title=title,
        body=body,
        metadata={"reason": reason}
    )
