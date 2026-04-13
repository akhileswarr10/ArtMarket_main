import asyncio
from sqlalchemy import text
from core.database import engine

async def check(): 
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
        print("Tables:", [row[0] for row in result])

if __name__ == "__main__":
    asyncio.run(check())
