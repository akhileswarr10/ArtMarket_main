import asyncio
from core.database import engine
from sqlalchemy import text

async def check_roles():
    async with engine.begin() as conn:
        result = await conn.execute(text('SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 20'))
        rows = result.fetchall()
        print(f"{'Email':<35} {'Role':<12} ID")
        print('-' * 80)
        for r in rows:
            role_val = r.role if r.role else "NULL"
            print(f"{str(r.email):<35} {role_val:<12} {r.id}")

asyncio.run(check_roles())
