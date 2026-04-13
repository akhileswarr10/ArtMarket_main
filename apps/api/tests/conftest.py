import pytest_asyncio, uuid, os
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient, ASGITransport

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app
from models import Base
from core.database import get_db
from core.config import get_settings

from sqlalchemy.pool import NullPool
settings = get_settings()
TEST_ENGINE = create_async_engine(
    os.environ.get("TEST_DATABASE_URL", settings.DATABASE_URL),
    echo=False,
    poolclass=NullPool,
    connect_args={"server_settings": {"search_path": "public"}, "statement_cache_size": 0}
)
TestSession = async_sessionmaker(TEST_ENGINE, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

from unittest.mock import patch
@pytest_asyncio.fixture(autouse=True)
def mock_supabase():
    with patch("routers.users.supabase_admin") as mock:
        yield mock

import core.database
core.database.engine = TEST_ENGINE
core.database.AsyncSessionLocal = TestSession

@pytest_asyncio.fixture()
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

def make_jwt(supabase_id: str, role: str = None, email: str = None) -> str:
    payload = {
        "sub": supabase_id, "email": email or f"{supabase_id}@example.com",
        "aud": "authenticated",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=1),
        "app_metadata": {"role": role} if role else {},
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")