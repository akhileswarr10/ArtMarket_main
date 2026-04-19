import asyncio
import uuid
from services.celery_app import celery_app, CELERY_AVAILABLE
from core.database import AsyncSessionLocal


async def _remove_sold_artworks(artwork_ids: list[str]):
    from repositories.cart import CartRepository
    async with AsyncSessionLocal() as db:
        repo = CartRepository(db)
        await repo.remove_sold_items([uuid.UUID(id) for id in artwork_ids])


def remove_sold_artworks_from_carts(artwork_ids: list[str]):
    """Remove sold artworks from all carts. Enqueues via Celery if available, else runs inline."""
    if not artwork_ids:
        return
        
    # Attempt Celery if available, but wrap in try/except to handle broker connection failures
    if CELERY_AVAILABLE and celery_app:
        try:
            # We use apply_async with a short timeout or just delay 
            # and catch the immediate connection error if Redis is down.
            _celery_remove_sold.delay(artwork_ids)
            return # Successfully enqueued
        except Exception:
            # Redis is likely down, fall back to inline background task
            pass

    # Fallback: fire-and-forget in background (no celery worker needed)
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_remove_sold_artworks(artwork_ids))
    except RuntimeError:
        asyncio.run(_remove_sold_artworks(artwork_ids))


if CELERY_AVAILABLE and celery_app:
    @celery_app.task(name="services.tasks.remove_sold_artworks_from_carts")
    def _celery_remove_sold(artwork_ids: list[str]):
        asyncio.run(_remove_sold_artworks(artwork_ids))

