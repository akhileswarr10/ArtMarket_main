import asyncio
from core.database import AsyncSessionLocal
from models import Notification, User
from sqlalchemy import select, delete
import uuid

async def verify_notification_fix():
    async with AsyncSessionLocal() as db:
        # Get a user id to use
        res = await db.execute(select(User.id).limit(1))
        user_id = res.scalar()
        
        if not user_id:
            print("No users found to test with.")
            # Create a temporary user if needed, but let's assume one exists
            return

        print(f"Testing Notification creation for user {user_id}...")
        
        try:
            # Test ORM creation with metadata_data
            notification = Notification(
                user_id=user_id,
                type="test_type",
                title="Test Title",
                body="Test Body",
                metadata_data={"test_key": "test_value"}
            )
            db.add(notification)
            await db.commit()
            print("SUCCESS: Notification created with metadata_data via ORM.")
            
            # Cleanup
            await db.execute(delete(Notification).where(Notification.id == notification.id))
            await db.commit()
            print("Cleanup complete.")
            
        except Exception as e:
            print(f"FAILURE: Could not create notification: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(verify_notification_fix())
