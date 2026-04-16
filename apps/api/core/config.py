from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_STORAGE_BUCKET: str = "artworks"

    # Database
    DATABASE_URL: str               # asyncpg, port 6543 (runtime/pooler)
    DATABASE_MIGRATION_URL: str     # asyncpg, port 5432 (session mode for alembic)

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # App
    DEBUG: bool = False
    WEBHOOK_SECRET: str = ""        # Supabase Auth webhook secret (if configured)
    
    # Commerce & Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    RESEND_API_KEY: str = ""
    MAX_ORDER_VALUE: float = 500000.0
    CART_MAX_CANCELLED_ORDERS_DAYS: int = 7
    CART_MAX_CANCELLED_ORDERS_COUNT: int = 3

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v

@lru_cache()
def get_settings() -> Settings:
    return Settings()