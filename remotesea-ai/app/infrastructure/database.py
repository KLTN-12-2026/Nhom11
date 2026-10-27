from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


# One handle per logical database (main remotesea_ai, RAG remotesea_rag) —
# own engine, session factory, and DeclarativeBase/metadata, so Alembic's two
# migration chains (alembic/, alembic_rag/) each see only their own
# database's models. main_db.py/rag_db.py each build exactly one of these
# from their own database_url — this replaces what used to be two
# hand-duplicated copies of the same engine/sessionmaker/Base boilerplate.
#
# No statement_cache_size/poolclass workarounds here — a real
# DuplicatePreparedStatementError against Supabase turned out to be caused
# by DATABASE_URL pointing at Supabase's *transaction-mode* pooler (port
# 6543), which doesn't properly support prepared statements at all (with or
# without SQLAlchemy's own pooling on top — tried both, neither fully
# fixed it). The actual fix is using the *session-mode* pooler (port 5432)
# instead, where each connection gets a dedicated backend connection for
# its lifetime — see .env. Fixing the wrong config beats papering over it
# with defensive settings that have a real, ongoing performance cost
# (no query-plan caching, no connection reuse) for a problem that
# shouldn't exist once the port is right.
class DatabaseHandle:
    def __init__(self, database_url: str) -> None:
        self.engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)

        class Base(DeclarativeBase):
            pass

        self.base: type[DeclarativeBase] = Base

    # FastAPI dependency — one session per request, always closed after,
    # matching the standard SQLAlchemy async + FastAPI pattern (equivalent
    # to NestJS's PrismaService being request-scoped via DI).
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self.session_factory() as session:
            yield session


def create_database(database_url: str) -> DatabaseHandle:
    return DatabaseHandle(database_url)
