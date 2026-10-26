from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


# One handle per logical database (main remotesea_ai, RAG remotesea_rag) —
# own engine, session factory, and DeclarativeBase/metadata, so Alembic's two
# migration chains (alembic/, alembic_rag/) each see only their own
# database's models. main_db.py/rag_db.py each build exactly one of these
# from their own database_url — this replaces what used to be two
# hand-duplicated copies of the same engine/sessionmaker/Base boilerplate.
class DatabaseHandle:
    def __init__(self, database_url: str) -> None:
        self.engine: AsyncEngine = create_async_engine(
            database_url,
            pool_pre_ping=True,
            # asyncpg caches prepared statements per-connection by default —
            # incompatible with PgBouncer running in transaction-pooling mode
            # (e.g. Supabase's pooler on port 6543), which hands out a
            # different backend connection per transaction: a statement
            # prepared against one backend connection doesn't exist on the
            # next, raising DuplicatePreparedStatementError/"prepared
            # statement does not exist" under real concurrent use. Harmless
            # on a direct (non-pooled) connection like local Docker Postgres
            # — just skips a minor query-plan-caching optimization there —
            # so this is set unconditionally rather than branching on which
            # database_url was given.
            connect_args={"statement_cache_size": 0},
        )
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
