from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus
from config import settings

DB_NAME = settings.DB_NAME

if settings.MONGO_USERNAME and settings.MONGO_PASSWORD:
    MONGODB_URL = (
        f"mongodb+srv://{quote_plus(settings.MONGO_USERNAME)}"
        f":{quote_plus(settings.MONGO_PASSWORD)}"
        f"@{settings.MONGO_HOST}/?appName=Cluster0"
    )
else:
    MONGODB_URL = settings.MONGODB_URL

try:
    client = AsyncIOMotorClient(MONGODB_URL) if MONGODB_URL else None
    db     = client[DB_NAME] if client else None
except Exception as e:
    print(f"MongoDB client init error: {e}")
    client = None
    db     = None

async def check_connection():
    if not db:
        print("❌ No MongoDB credentials configured")
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
