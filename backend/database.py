from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import quote_plus
import os

DB_NAME = os.getenv("DB_NAME", "agriintel")

# Build URL from components (preferred — avoids %-encoding issues)
_username = os.getenv("MONGO_USERNAME", "")
_password = os.getenv("MONGO_PASSWORD", "")
_host     = os.getenv("MONGO_HOST", "cluster0.d09nwvq.mongodb.net")

if _username and _password:
    MONGODB_URL = (
        f"mongodb+srv://{quote_plus(_username)}:{quote_plus(_password)}"
        f"@{_host}/?appName=Cluster0"
    )
else:
    MONGODB_URL = os.getenv("MONGODB_URL", "")

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
