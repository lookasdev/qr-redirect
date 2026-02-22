import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "scanvas")

client = AsyncIOMotorClient(MONGODB_URL)
db = client[DB_NAME]

async def connect_to_mongo():
    print(f"Connected to MongoDB at {MONGODB_URL.split('@')[-1]}")
    await init_indexes()

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

async def init_indexes():
    # Index for QRLinks collection
    await db["links"].create_index("slug", unique=True)
    await db["links"].create_index("owner_id")
    
    # Indexes for ScanEvents collection
    await db["scan_events"].create_index("slug")
    await db["scan_events"].create_index("timestamp")
    # Compound index for fast queries by slug and time
    await db["scan_events"].create_index([("slug", 1), ("timestamp", -1)])
