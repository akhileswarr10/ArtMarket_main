import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, List

from core.database import get_db
from core.deps import get_current_user, require_artist, require_admin
from models import User
from repositories.verification import VerificationRepository
from schemas.verification import VerificationApplyRequest, VerificationDecisionRequest, VerificationQueueItem
from services.notification_service import notify_verification_approved, notify_verification_rejected
from services.audit_service import log

router = APIRouter(prefix="/verification", tags=["verification"])

@router.post("/apply")
async def apply_for_verification(
    current_user: Annotated[User, Depends(require_artist)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = VerificationRepository(db)
    profile = await repo.apply(current_user.id)
    return {"status": profile.verification_status}

@router.get("/queue", response_model=List[VerificationQueueItem])
async def get_verification_queue(
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = VerificationRepository(db)
    queue = await repo.get_queue()
    return [
        VerificationQueueItem(
            artist_id=p.user_id,
            display_name=p.display_name,
            verification_submitted_at=p.verification_submitted_at,
            verification_notes=p.verification_notes
        ) for p in queue
    ]

@router.patch("/{artist_id}/approve")
async def approve_verification(
    artist_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = VerificationRepository(db)
    profile = await repo.approve(artist_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Artist profile not found")
        
    await notify_verification_approved(db, artist_id)
    await log(db, current_user.id, "verification.approved", "user", artist_id)
    return {"status": "success"}

@router.patch("/{artist_id}/reject")
async def reject_verification(
    artist_id: uuid.UUID,
    decision_in: VerificationDecisionRequest,
    current_user: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    repo = VerificationRepository(db)
    profile = await repo.reject(artist_id, decision_in.reason or "Does not meet guidelines")
    if not profile:
        raise HTTPException(status_code=404, detail="Artist profile not found")
        
    await notify_verification_rejected(db, artist_id, decision_in.reason or "Does not meet guidelines")
    await log(db, current_user.id, "verification.rejected", "user", artist_id, new_data={"reason": decision_in.reason})
    return {"status": "success"}
