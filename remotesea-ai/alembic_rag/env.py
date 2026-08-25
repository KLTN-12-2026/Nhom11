import asyncio
import uuid
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.infrastructure.config import get_settings
from app.infrastructure.rag_db import RagBase

# Import every RAG model module so its table registers on RagBase.metadata
# before autogenerate compares against it — same reasoning as alembic/env.py
# for the main database.
from app.infrastructure.models import rag_chunk, rag_document  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = RagBase.metadata


def get_url() -> str:
    return get_settings().rag_database_url


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    # See alembic/env.py's identical block for the full reasoning and live
    # verification against Supabase's port-6543 pooler: a random
    # prepared_statement_name_func is required (statement_cache_size=0
    # alone is insufficient) to avoid DuplicatePreparedStatementError when
    # DATABASE_URL/RAG_DATABASE_URL points through a transaction-mode
    # pgbouncer.
    connectable: AsyncEngine = create_async_engine(
        get_url(),
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
        },
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
