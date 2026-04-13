import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from core.config import get_settings

async def apply_rls():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_MIGRATION_URL)
    with open("supabase/rls_policies.sql", "r") as f:
        sql = f.read()
    
    async with engine.begin() as conn:
        dbapi_conn = await conn.get_raw_connection()
        await dbapi_conn.driver_connection.execute(sql)
        print("RLS Policies applied successfully.")

if __name__ == "__main__":
    asyncio.run(apply_rls())
