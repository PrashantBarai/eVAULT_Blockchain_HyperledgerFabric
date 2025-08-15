from pymongo import MongoClient

# Database connection
client = MongoClient("mongodb+srv://ammar:IJZdajya7pTz45q9@cluster0.o2qwc.mongodb.net/")
db = client['evault']

users_collection = db["users"]
case_collection = db["cases"]
lawyer_notification = db["lawyer_notifications"]
benchclerk_notification = db["benchclerk_notifications"]

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://myuser:mypassword@localhost:5432/mydatabase"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
