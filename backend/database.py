from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class _DB:
    client: AsyncIOMotorClient = None
    db = None

_db = _DB()

async def connect():
    _db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    _db.db = _db.client[settings.DB_NAME]
    print("[OK] MongoDB connected")

async def disconnect():
    if _db.client:
        _db.client.close()

def get_db():
    return _db.db
