import asyncio
from core.database import engine
from models import (
    Base, User, ArtistProfile, BuyerProfile, Category, Tag, 
    Artwork, ArtworkImage, ArtworkTag, Favorite, AuditLog,
    Order, OrderItem, Cart, CartItem, Transaction, Notification,
    AIJob, SystemSetting
)

async def init_db():
    print("Initializing database...")
    async with engine.begin() as conn:
        # Verify what tables are in metadata
        print(f"Tables in metadata: {Base.metadata.tables.keys()}")
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
