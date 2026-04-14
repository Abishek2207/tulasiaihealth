"""
TulsiHealth Alembic Configuration
Database migration management for production-grade healthcare platform
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Import the models for autogenerate support
from api.models import Base
from api.database import Base as DatabaseBase

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add TulsiHealth-specific model attributes
target_metadata = DatabaseBase.metadata

# Other values from the config, defined by the needs of env.py
my_important_option = config.get_main_option("my_important_option")


def get_database_url():
    """Get database URL from environment or config"""
    # Try environment variable first
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        # Fallback to config
        database_url = config.get_main_option("sqlalchemy.url")
    
    # Ensure TulsiHealth database name
    if database_url and "tulsihealth" in database_url.lower():
        database_url = database_url.replace("tulsihealth", "TulsiHealth")
    
    return database_url


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_schemas=True,
        version_table_schema="public"
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    
    # Override sqlalchemy.url with our database URL
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            include_schemas=True,
            version_table_schema="public",
            # TulsiHealth-specific configurations
            render_as_batch=True,
            transaction_per_migration=True
        )

        with context.begin_transaction():
            context.run_migrations()


# TulsiHealth-specific migration hooks
def process_revision_directives(context, revision, directives):
    """Process revision directives for TulsiHealth"""
    
    # Add custom directives for TulsiHealth
    if "tulsihealth" in revision.lower():
        directives.append("autogenerate")
        directives.append("spillover-file")
    
    return directives


def on_revision_apply(context, revision):
    """Hook called when a revision is applied"""
    
    # Log migration application for TulsiHealth audit
    try:
        from api.services.audit_service import AuditService
        from api.database import get_db_session
        
        async with get_db_session() as db:
            audit_service = AuditService(db)
            await audit_service.log_event(
                user_id=1,  # System user
                action="migration_applied",
                resource="alembic",
                resource_id=revision.revision,
                details={
                    "message": "TulsiHealth database migration applied",
                    "revision": revision.revision,
                    "timestamp": context.get_context().get("revision_time")
                }
            )
    except Exception as e:
        print(f"Failed to log migration audit: {e}")


def on_revision_downgrade(context, revision):
    """Hook called when a revision is downgraded"""
    
    # Log migration downgrade for TulsiHealth audit
    try:
        from api.services.audit_service import AuditService
        from api.database import get_db_session
        
        async with get_db_session() as db:
            audit_service = AuditService(db)
            await audit_service.log_event(
                user_id=1,  # System user
                action="migration_downgraded",
                resource="alembic",
                resource_id=revision.revision,
                details={
                    "message": "TulsiHealth database migration downgraded",
                    "revision": revision.revision,
                    "timestamp": context.get_context().get("revision_time")
                }
            )
    except Exception as e:
        print(f"Failed to log migration audit: {e}")


# TulsiHealth-specific environment setup
def configure_tulsihealth_environment():
    """Configure environment for TulsiHealth migrations"""
    
    # Set environment variables for TulsiHealth
    os.environ.setdefault("TULSIHEALTH_ENV", "migration")
    os.environ.setdefault("TULSIHEALTH_MIGRATION", "true")
    
    # Add TulsiHealth-specific paths
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    sys.path.insert(0, project_root)


# Initialize TulsiHealth environment
configure_tulsihealth_environment()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.models.database import Base
from api.core.config import get_settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    """Get database URL from settings"""
    settings = get_settings()
    return settings.database_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations with a connection"""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        include_object=include_object,
        render_item=render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in async mode"""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def include_object(object, name, type_, reflected, compare_to):
    """Custom object inclusion logic"""
    # Skip system tables and views
    if type_ == "table" and (name.startswith("information_schema") or name.startswith("pg_")):
        return False
    return True


def render_item(type_, obj, autogen_context):
    """Custom rendering for certain objects"""
    if type_ == "type" and hasattr(obj, "name") and obj.name == "uuid":
        return autogen_context.dialect.type_compiler.process(obj)
    return False


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
