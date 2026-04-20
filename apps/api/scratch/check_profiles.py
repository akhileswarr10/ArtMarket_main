import asyncio
from core.database import engine
from sqlalchemy import text
from models import User, ArtistProfile, BuyerProfile
from sqlalchemy.orm import selectinload
from sqlalchemy import select

async def check_profiles():
    async with engine.begin() as conn:
        # Just a raw check first
        result = await conn.execute(text("SELECT u.email, u.role, ap.id as artist_id, bp.id as buyer_id FROM users u LEFT JOIN artist_profiles ap ON u.id = ap.user_id LEFT JOIN buyer_profiles bp ON u.id = bp.user_id"))
        rows = result.fetchall()
        print(f"{'Email':<35} {'Role':<12} {'ArtistProf':<12} {'BuyerProf':<12}")
        print('-' * 80)
        for r in rows:
            print(f"{str(r.email):<35} {str(r.role):<12} {str(r.artist_id is not None):<12} {str(r.buyer_id is not None):<12}")

asyncio.run(check_profiles())
