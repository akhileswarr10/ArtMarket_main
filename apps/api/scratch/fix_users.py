import asyncio
from core.database import engine
from sqlalchemy import select, text
from models import User, ArtistProfile, BuyerProfile

async def fix_users():
    async with engine.begin() as conn:
        # 1. Update roles
        await conn.execute(text("UPDATE users SET role = 'admin' WHERE email = 'admin@gmail.com'"))
        await conn.execute(text("UPDATE users SET role = 'artist' WHERE email = 'artist@gmail.com'"))
        await conn.execute(text("UPDATE users SET role = 'buyer' WHERE email = 'buyer@gmail.com'"))
        
        # 2. Get users to create profiles
        result = await conn.execute(text("SELECT id, email, role FROM users"))
        users = result.fetchall()
        
        for u in users:
            if u.role == 'artist':
                # Check if profile exists
                check_profile = await conn.execute(text("SELECT id FROM artist_profiles WHERE user_id = :uid"), {"uid": u.id})
                if not check_profile.fetchone():
                    print(f"Creating ArtistProfile for {u.email}")
                    await conn.execute(text("INSERT INTO artist_profiles (id, user_id, display_name, is_verified) VALUES (gen_random_uuid(), :uid, :name, false)"), {"uid": u.id, "name": u.email.split('@')[0].capitalize()})
            elif u.role == 'buyer':
                # Check if profile exists
                check_profile = await conn.execute(text("SELECT id FROM buyer_profiles WHERE user_id = :uid"), {"uid": u.id})
                if not check_profile.fetchone():
                    print(f"Creating BuyerProfile for {u.email}")
                    await conn.execute(text("INSERT INTO buyer_profiles (id, user_id, display_name) VALUES (gen_random_uuid(), :uid, :name)"), {"uid": u.id, "name": u.email.split('@')[0].capitalize()})
        
        await conn.commit()
    print("Users fixed successfully.")

asyncio.run(fix_users())
