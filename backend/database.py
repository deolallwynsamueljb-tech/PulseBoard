from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL", "")
DB_NAME     = os.getenv("DB_NAME", "agriintel")

client = AsyncIOMotorClient(MONGODB_URL) if MONGODB_URL else None
db     = client[DB_NAME] if client else None

async def check_connection():
    if not db:
        print("❌ No MONGODB_URL set")
        return False
    try:
        await db.command("ping")
        print("✅ MongoDB connected!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def get_db():
    return db
