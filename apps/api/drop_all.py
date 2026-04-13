import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from models import Base
from core.config import get_settings

async def drop():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_MIGRATION_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("Dropped all tables successfully via metadata.")

if __name__ == "__main__":
    asyncio.run(drop())
