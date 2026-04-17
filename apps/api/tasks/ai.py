import asyncio
from core.database import AsyncSessionLocal
from repositories.artwork import ArtworkRepository
from ai_services.captioning.service import CaptioningService
from ai_services.pricing.service import PricingService
from core.supabase import supabase_admin
from core.config import get_settings
from sqlalchemy import text
import uuid

settings = get_settings()

async def _update_job_status(db, job_id: str, status: str, result: dict = None, error_message: str = None):
    # Updating by the internal job id since we removed celery UUIDs.
    query = text("""
        UPDATE ai_jobs
        SET status = :status, result = :result, error_message = :error_message, updated_at = now()
        WHERE id = :job_id
        RETURNING id, artwork_id
    """)
    import json
    val = await db.execute(query, {
        "status": status,
        "result": json.dumps(result) if result else None,
        "error_message": error_message,
        "job_id": job_id
    })
    res = val.fetchone()
    await db.commit()
    return res

async def _write_notification(db, user_id, type_, title, metadata, error=False):
    query = text("""
        INSERT INTO notifications (id, user_id, type, title, body, data, is_read)
        VALUES (:id, :user_id, :type, :title, :body, :data, false)
    """)
    import json
    await db.execute(query, {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type_,
        "title": title,
        "body": "",
        "data": json.dumps(metadata)
    })
    await db.commit()

async def create_job_record(artwork_id: str, job_type: str) -> str:
    """Creates a job record in DB immediately and returns its ID."""
    job_id = str(uuid.uuid4())
    async with AsyncSessionLocal() as db:
        query = text("""
            INSERT INTO ai_jobs (id, artwork_id, job_type, status, celery_task_id, attempts)
            VALUES (:id, :artwork_id, :job_type, 'queued', :celery_task_id, 0)
        """)
        await db.execute(query, {
            "id": job_id,
            "artwork_id": artwork_id,
            "job_type": job_type,
            "celery_task_id": job_id # fallback legacy column
        })
        await db.commit()
    return job_id

async def run_captioning(job_id: str, artwork_id: str, storage_path: str):
    async with AsyncSessionLocal() as db:
        repo = ArtworkRepository(db)
        artwork = await repo.get_by_id(artwork_id)
        if not artwork:
            return

        try:
            await _update_job_status(db, job_id, "processing")
            res = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(storage_path)
            
            # Since CaptioningService.run uses synchronous httpx, we run it in a thread out of the async loop
            result = await asyncio.to_thread(CaptioningService.run, res)
            
            artwork.ai_title_suggestion = result.get("title")
            artwork.ai_description_suggestion = result.get("description")
            artwork.ai_style_suggestion = result.get("detected_style")
            artwork.ai_medium_suggestion = result.get("detected_medium")
            
            from sqlalchemy.sql import func
            artwork.ai_generated_at = func.now()
            
            await _update_job_status(db, job_id, "done", result=result)
            
            await _write_notification(
                db, str(artwork.artist_id), "ai_job_complete", "AI formatting complete", 
                {"artwork_id": str(artwork.id), "job_type": "captioning"}
            )
            
        except Exception as e:
            await db.rollback()
            await _update_job_status(db, job_id, "failed", error_message=str(e))
            await _write_notification(
                db, str(artwork.artist_id), "ai_job_failed", "AI task failed", 
                {"artwork_id": str(artwork.id), "job_type": "captioning"}, True
            )

async def run_pricing(job_id: str, artwork_id: str):
    async with AsyncSessionLocal() as db:
        repo = ArtworkRepository(db)
        artwork = await repo.get_by_id(artwork_id)
        if not artwork:
            return

        try:
            await _update_job_status(db, job_id, "processing")
            
            is_verified = False  
            # Avoid lazy loading relationships inside this async context
            # Fallback to a basic assumption since artist artworks aren't loaded eagerly
            count = 1 
            
            # Pricing prediction is synchronous too
            result = await asyncio.to_thread(
                PricingService.predict,
                artwork.medium, artwork.style, 1000, is_verified, count
            )
            
            artwork.ai_price_suggestion = result.get("suggested_price")
            artwork.ai_price_confidence = result.get("confidence")
            
            from sqlalchemy.sql import func
            artwork.ai_generated_at = func.now()
            
            await _update_job_status(db, job_id, "done", result=result)
            
        except Exception as e:
            await db.rollback()
            await _update_job_status(db, job_id, "failed", error_message=str(e))
