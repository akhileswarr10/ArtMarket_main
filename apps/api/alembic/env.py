import os
import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

from models import Base
import core.config

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    # UseDATABASE_MIGRATION_URL for schema migrations
    url = os.environ.get("DATABASE_MIGRATION_URL")
    if not url:
        settings = core.config.get_settings()
        url = settings.DATABASE_MIGRATION_URL
    return url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_async_engine(get_url())

    async with connectable.connect() as connection:
        await connection.run_sync(
            lambda c: context.configure(
                connection=c, target_metadata=target_metadata
            )
        )
        async with connection.begin():
            await connection.run_sync(lambda c: context.run_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
