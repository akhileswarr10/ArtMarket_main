import asyncio
from core.database import engine
from sqlalchemy import text

async def check_tables():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = result.fetchall()
        print('Tables in public schema:')
        for t in tables:
            print(f'- {t[0]}')

asyncio.run(check_tables())
