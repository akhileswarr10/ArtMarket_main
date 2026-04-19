try:
    from celery import Celery
    from core.config import get_settings

    settings = get_settings()

    celery_app = Celery(
        "artmarket",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_BROKER_URL,
        include=["services.tasks"]
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_routes={
            "services.tasks.remove_sold_artworks_from_carts": {"queue": "default"},
        }
    )
    CELERY_AVAILABLE = True
except ImportError:
    celery_app = None
    CELERY_AVAILABLE = False
