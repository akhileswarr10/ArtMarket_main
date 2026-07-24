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
    # Raise the exception so process_ai_job can capture the real error message
    result = supabase_admin.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
        storage_path, expires_in=3600
    )
    if isinstance(result, dict) and (result.get("error") or not (result.get("signedURL") or result.get("signedUrl"))):
         raise Exception(f"Supabase Error: {result.get('error', 'No URL in response')}")
    return result.get("signedURL") or result.get("signedUrl")

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
            
            # Try to find a primary/confirmed image, fallback to any image if it's the first upload
            primary_img = next((img for img in artwork_full.images if img.is_confirmed), None)
            if not primary_img and artwork_full.images:
                primary_img = artwork_full.images[0]
                
            if not primary_img:
                raise Exception("No images found for artwork to analyze")

            signed_url = _generate_signed_url(primary_img.storage_path)
            if not signed_url:
                raise Exception("Could not generate signed URL for image")

            # 2. Analyze artwork (caption + style detection in one call)
            analysis = await analyze_artwork(signed_url)
            caption = analysis.get("caption")
            detected_style = analysis.get("style") or artwork.style
            
            # 3. Pricing + Tags
            # Tags come directly from the vision model — fall back to text tagger only if empty
            tags = analysis.get("tags") or []
            if not tags:
                from ai_services.tagging.groq_tagger import generate_tags as _gen_tags
                tags = await _gen_tags(
                    caption=caption,
                    medium=artwork.medium,
                    style=detected_style
                )

            price = await generate_price_suggestion(
                caption=caption, 
                medium=artwork.medium, 
                style=detected_style, 
                dimensions=artwork.dimensions
            )

            # 4. Save result — use AI-generated title directly
            suggested_title = analysis.get("title") or "Untitled"

            job.result = {
                "title": suggested_title,
                "description": caption or "A beautifully crafted piece of art.",
                "suggested_price": price,
                "tags": tags,
                "detected_style": detected_style,
            }
            job.status = "done"

            # Persist results to artwork for easier polling
            artwork.ai_title_suggestion = suggested_title
            artwork.ai_description_suggestion = caption
            artwork.ai_style_suggestion = detected_style
            artwork.ai_price_suggestion = price
            artwork.ai_tags_suggestion = tags
            from sqlalchemy.sql import func
            artwork.ai_generated_at = func.now()

            # 5. Create notification
            notification = Notification(
                user_id=artwork.artist_id,
                type="ai_job_completed",
                title="AI Magic Complete!",
                body=f"We have generated a description and price suggestion for your artwork '{artwork.title or 'Untitled'}'.",
                metadata_data={"artwork_id": str(artwork.id), "job_id": str(job.id)}
            )
            db.add(notification)

            # --- Embedding generation (non-fatal) ---
            try:
                from ai_services.embeddings.service import generate_artwork_embedding
                from sqlalchemy import text as sql_text
                embedding_vec = await generate_artwork_embedding(
                    title=suggested_title,
                    description=caption,
                    medium=artwork.medium,
                    style=detected_style,
                    tags=tags,
                )
                if embedding_vec:
                    vec_str = "[" + ",".join(str(v) for v in embedding_vec) + "]"
                    await db.execute(
                        sql_text("""
                            INSERT INTO artwork_embeddings (artwork_id, embedding, model_name)
                            VALUES (:artwork_id, CAST(:embedding AS vector(384)), :model_name)
                            ON CONFLICT (artwork_id) DO UPDATE
                              SET embedding    = EXCLUDED.embedding,
                                  model_name   = EXCLUDED.model_name,
                                  generated_at = now()
                        """),
                        {
                            "artwork_id": str(artwork.id),
                            "embedding": vec_str,
                            "model_name": "all-MiniLM-L6-v2",
                        },
                    )
            except Exception as embed_err:
                print(f"[embeddings] non-fatal error: {embed_err}")
            # --- End embedding generation ---

            await db.commit()

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            await db.commit()
