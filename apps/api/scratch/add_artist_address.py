import asyncio
from sqlalchemy import text
from core.database import AsyncSessionLocal

async def add_artist_address():
    async with AsyncSessionLocal() as db:
        try:
            # Check if column already exists
            result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='artist_profiles' AND column_name='address';"))
            if not result.fetchone():
                print("Adding 'address' column to 'artist_profiles'...")
                await db.execute(text("ALTER TABLE artist_profiles ADD COLUMN address JSONB;"))
                await db.commit()
                print("Column added successfully.")
            else:
                print("Column 'address' already exists.")
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(add_artist_address())
