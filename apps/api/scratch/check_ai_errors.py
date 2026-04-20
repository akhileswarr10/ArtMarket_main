import asyncio
from core.database import AsyncSessionLocal
from sqlalchemy import text

async def check_jobs():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("""
            SELECT id, artwork_id, job_type, error, status, created_at 
            FROM ai_jobs 
            WHERE status = 'failed' 
            ORDER BY created_at DESC 
            LIMIT 5
        """))
        rows = res.fetchall()
        if not rows:
            print("No failed AI jobs found.")
            return
            
        for row in rows:
            print(f"Job ID: {row.id}")
            print(f"Artwork ID: {row.artwork_id}")
            print(f"Type: {row.job_type}")
            print(f"Status: {row.status}")
            print(f"Created At: {row.created_at}")
            print(f"Error: {row.error}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(check_jobs())
