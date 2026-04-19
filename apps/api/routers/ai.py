from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from core.database import get_db
from core.deps import get_current_user, RequiredArtist
from models import AIJob, User
from schemas.ai import AIJobResponse

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/jobs/{job_id}", response_model=AIJobResponse)
async def get_ai_job(
    job_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db),
):
    job = await db.get(AIJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="AI job not found")
        
    # Optional: check if the user is the owner of the artwork
    # For now, if they have the ID, they can see it
    return job
