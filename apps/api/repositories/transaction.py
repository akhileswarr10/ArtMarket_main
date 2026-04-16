import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from models import Transaction

class TransactionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, order_id: uuid.UUID, type: str, amount: float, currency: str, status: str, stripe_response: Optional[dict] = None) -> Transaction:
        tx = Transaction(
            order_id=order_id,
            type=type,
            amount=amount,
            currency=currency,
            status=status,
            stripe_response=stripe_response
        )
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(tx)
        return tx
