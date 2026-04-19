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
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from core.database import get_db
from core.deps import get_current_user, RequiredArtist
from repositories.artwork import ArtworkRepository
from repositories.ai_job import AIJobRepository
from schemas.ai import ArtworkAIStatusResponse, ApplyAISuggestionsRequest, MessageResponse, AIJobStatus
from schemas.artwork import ArtworkResponse
from routers.artworks import _build_artwork_response
from models import User
from tasks.ai import run_captioning, run_pricing

router = APIRouter(prefix="/artworks", tags=["ai"])
admin_router = APIRouter(prefix="/admin/ai-jobs", tags=["admin_ai"])

@router.get("/{artwork_id}/ai-status", response_model=ArtworkAIStatusResponse)
async def get_ai_status(
    artwork_id: UUID,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db)
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    ai_repo = AIJobRepository(db)
    jobs = await ai_repo.get_by_artwork(artwork_id)

    return ArtworkAIStatusResponse(
        artwork_id=artwork_id,
        jobs=[AIJobStatus.model_validate(j) for j in jobs],
        ai_title_suggestion=artwork.ai_title_suggestion,
        ai_description_suggestion=artwork.ai_description_suggestion,
        ai_style_suggestion=artwork.ai_style_suggestion,
        ai_medium_suggestion=artwork.ai_medium_suggestion,
        ai_price_suggestion=float(artwork.ai_price_suggestion) if artwork.ai_price_suggestion else None,
        ai_price_confidence=artwork.ai_price_confidence,
        ai_tags_suggestion=artwork.ai_tags_suggestion,
        ai_generated_at=artwork.ai_generated_at
    )

@router.post("/{artwork_id}/ai-retry", response_model=MessageResponse)
async def retry_ai_jobs(
    artwork_id: UUID,
    user: RequiredArtist,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404)
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403)

    images = [i for i in artwork.images if i.is_confirmed]
    if not images:
        raise HTTPException(status_code=400, detail="No images to process")
    
    from tasks.ai import run_captioning, run_pricing, create_job_record
    
    caption_job_id = await create_job_record(str(artwork_id), "captioning")
    price_job_id = await create_job_record(str(artwork_id), "pricing")
    
    background_tasks.add_task(run_captioning, caption_job_id, str(artwork_id), images[0].storage_path)
    background_tasks.add_task(run_pricing, price_job_id, str(artwork_id))

    return {"message": "AI jobs queued for retry"}

@router.post("/{artwork_id}/apply-ai-suggestions", response_model=ArtworkResponse)
async def apply_ai_suggestions(
    artwork_id: UUID,
    body: ApplyAISuggestionsRequest,
    user: RequiredArtist,
    db: AsyncSession = Depends(get_db)
):
    repo = ArtworkRepository(db)
    artwork = await repo.get_by_id(artwork_id)
    if not artwork:
        raise HTTPException(status_code=404)
    if str(artwork.artist_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403)

    update_data = {}
    if body.apply_title and artwork.ai_title_suggestion:
        update_data["title"] = artwork.ai_title_suggestion
    if body.apply_description and artwork.ai_description_suggestion:
        update_data["description"] = artwork.ai_description_suggestion
    if body.apply_style and artwork.ai_style_suggestion:
        update_data["style"] = artwork.ai_style_suggestion
    if body.apply_medium and artwork.ai_medium_suggestion:
        update_data["medium"] = artwork.ai_medium_suggestion
    if body.apply_price and artwork.ai_price_suggestion:
        update_data["price"] = artwork.ai_price_suggestion

    if update_data:
        artwork = await repo.update(artwork, update_data)
        
    return _build_artwork_response(artwork)

@admin_router.get("", response_model=List[AIJobStatus])
async def list_all_ai_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "admin":
        raise HTTPException(status_code=403)
    
    ai_repo = AIJobRepository(db)
    jobs = await ai_repo.get_all()
    return [AIJobStatus.model_validate(j) for j in jobs]
