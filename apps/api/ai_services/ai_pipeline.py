import uuid
from core.database import AsyncSessionLocal
from models import AIJob, Artwork, Notification
from repositories.artwork import ArtworkImageRepository
from ai_services.captioning.hf_captioner import generate_caption, analyze_artwork
from ai_services.pricing.hf_pricer import generate_price_suggestion
from ai_services.tagging.groq_tagger import generate_tags
from core.supabase import supabase_admin
from core.config import get_settings

settings = get_settings()

def _generate_signed_url(storage_path: str) -> str | None:
    try:
        result = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
            storage_path, expires_in=3600
        )
        return result.get("signedURL") or result.get("signedUrl")
    except Exception:
        return None

async def process_ai_job(job_id: uuid.UUID):
    async with AsyncSessionLocal() as db:
        job = await db.get(AIJob, job_id)
        if not job:
            return

        job.status = "running"
        await db.commit()

        try:
            # 1. Fetch Artwork Image
            artwork = await db.get(Artwork, job.artwork_id)
            if not artwork:
                raise Exception("Artwork not found")

            from sqlalchemy.orm import selectinload
            from sqlalchemy import select
            
            # Need to get images
            stmt = select(Artwork).options(selectinload(Artwork.images)).where(Artwork.id == job.artwork_id)
            res = await db.execute(stmt)
            artwork_full = res.scalar_one_or_none()
            
            if not artwork_full or not artwork_full.images:
                raise Exception("No images found for artwork")
            
            # Use the primary image or first confirmed image
            primary_img = next((img for img in artwork_full.images if img.is_confirmed), None)
            if not primary_img:
                raise Exception("No confirmed images found for artwork")

            signed_url = _generate_signed_url(primary_img.storage_path)
            if not signed_url:
                raise Exception("Could not generate signed URL for image")

            # 2. Analyze artwork (caption + style detection in one call)
            analysis = await analyze_artwork(signed_url)
            caption = analysis.get("caption")
            detected_style = analysis.get("style") or artwork.style
            
            # 3. Pricing + Tags
            price = await generate_price_suggestion(
                caption=caption, 
                medium=artwork.medium, 
                style=detected_style, 
                dimensions=artwork.dimensions
            )
            tags = await generate_tags(
                caption=caption,
                medium=artwork.medium,
                style=detected_style
            )

            # 4. Save result — title limited to 3 words to avoid overflow
            title_words = caption.split()[:3] if caption else []
            suggested_title = " ".join(title_words).rstrip(".,;:").title() if title_words else "Untitled"

            job.result = {
                "title": suggested_title,
                "description": caption or "A beautifully crafted piece of art.",
                "suggested_price": price,
                "tags": tags,
                "detected_style": detected_style,
            }
            job.status = "done"

            # 5. Create notification
            notification = Notification(
                user_id=artwork.artist_id,
                type="ai_job_completed",
                title="AI Magic Complete!",
                body=f"We have generated a description and price suggestion for your artwork '{artwork.title or 'Untitled'}'.",
                data={"artwork_id": str(artwork.id), "job_id": str(job.id)}
            )
            db.add(notification)
            await db.commit()

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            await db.commit()
