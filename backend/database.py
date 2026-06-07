from config import settings

DB_NAME = settings.DB_NAME
MONGODB_URL = settings.MONGODB_URL

# Client and db are created lazily inside check_connection() to avoid
# blocking the Python process at import time (mongodb+srv DNS resolution
# is synchronous in pymongo and can take 5-10 seconds on cold starts).
_client = None
_db = None

# Expose module-level names so `from database import client` keeps working
client = None
db = None


async def check_connection():
    global _client, _db, client, db
    if not MONGODB_URL:
        print("❌ No MONGODB_URL configured")
        return False
    # Create client lazily on first call
    if _client is None:
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            host_hint = MONGODB_URL.split("@")[-1].split("/")[0][:40]
            print(f"🔌 Connecting to: {host_hint!r}")
            _client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=6000)
            _db = _client[DB_NAME]
            client = _client
            db = _db
        except Exception as e:
            print(f"❌ MongoDB client init error: {e}")
            return False
    try:
        await _db.command("ping")
        print("✅ MongoDB connected!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False


def get_db():
    return _db
