import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from models import AuditLog

async def log(
    db: AsyncSession, 
    user_id: Optional[uuid.UUID], 
    action: str, 
    entity_type: str, 
    entity_id: Optional[uuid.UUID] = None, 
    old_data: Optional[dict] = None, 
    new_data: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    audit = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address
    )
    db.add(audit)
    await db.commit()
