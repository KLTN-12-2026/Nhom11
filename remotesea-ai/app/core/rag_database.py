from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# A genuinely separate database (remotesea_rag), not a schema inside
# remotesea_ai — its own engine, its own connection pool, its own
# DeclarativeBase/metadata, its own Alembic chain (see alembic_rag/). Mixing
# RagDocument/RagChunk into the main Base would make them show up in the
# main service's migrations and share its connection pool for no reason —
# this is deliberately as independent as remotesea_ai's database is from
# remotesea-api's.
rag_engine = create_async_engine(settings.rag_database_url, pool_pre_ping=True)
RagSessionLocal = async_sessionmaker(rag_engine, expire_on_commit=False)


class RagBase(DeclarativeBase):
    pass


async def get_rag_db() -> AsyncGenerator[AsyncSession, None]:
    async with RagSessionLocal() as session:
        yield session
