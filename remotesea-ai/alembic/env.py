import asyncio
import uuid
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.infrastructure.config import get_settings
from app.infrastructure.main_db import Base

# Import every model module so its table registers on Base.metadata before
# autogenerate compares against it — a model that exists in
# app/infrastructure/models/ but is never imported here would silently be
# invisible to `alembic revision --autogenerate`.
from app.infrastructure.models import (  # noqa: F401
    ai_conversation,
    ai_conversation_turn,
    ai_dataset,
    ai_feedback,
    ai_interaction,
    ai_model,
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    return get_settings().database_url


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
    # A transaction-mode pgbouncer/Supabase pooler (port 6543) multiplexes
    # many client connections onto a shared set of backend sockets, so
    # asyncpg's default sequential prepared-statement names
    # (__asyncpg_stmt_1__, _2__, ...) can collide with a statement some
    # *other* client already prepared on whichever backend this connection
    # happens to land on — asyncpg.exceptions.DuplicatePreparedStatementError,
    # deterministically reproduced against Supabase's port-6543 pooler even
    # on a single, one-shot, first-query connection (real failure seen in a
    # Render deploy). `statement_cache_size=0` alone does NOT fix this — it
    # only disables asyncpg's *client-side* cache of already-prepared
    # statements, not the colliding server-side name (verified live: still
    # fails with only this set — same insufficient result database.py's own
    # comment documents for the app's runtime engine). The actual fix is
    # `prepared_statement_name_func`: generate a random name per prepare so
    # it can never collide with another client's statement on the shared
    # backend, verified live across 5 consecutive connections against the
    # port-6543 pooler. Applied here (not database.py) because this is a
    # migration-only concern — the app's long-lived engine already avoids
    # this entirely by using the session-mode pooler port (5432) instead,
    # where each connection gets its own dedicated backend; a fresh deploy
    # target that's only ever handed a transaction-mode DATABASE_URL still
    # needs `alembic upgrade head` itself to work regardless.
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
