"""
Database Initialization & Seeding Script for TulsiHealth
Initializes the SQLite database and seeds NAMASTE terminology from datasets/namaste.csv.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from api.models.database import Base
from api.core.config import settings
from api.services.namaste_service import namaste_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    """Create all tables and seed initial data"""
    try:
        logger.info(f"Initializing database at {settings.database_url}")
        
        # Create engine
        engine = create_async_engine(settings.database_url, echo=settings.database_echo)
        
        # Create tables
        async with engine.begin() as conn:
            # In a production environment with Alembic, we'd use migrations
            # But for initialization/reset, we create all
            logger.info("Creating tables...")
            await conn.run_sync(Base.metadata.create_all)
        
        # Create session factory
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            # Seed NAMASTE terminology
            csv_path = "../datasets/namaste.csv"
            logger.info(f"Seeding NAMASTE terminology from {csv_path}...")
            
            stats = await namaste_service.ingest_from_csv(csv_path, session)
            logger.info(f"NAMASTE Seeding complete: {stats}")

            # Verify seeding
            codes = await namaste_service.get_all_codes(session)
            logger.info(f"Verified {len(codes)} NamasteCodes in database.")

        await engine.dispose()
        logger.info("Database initialization complete.")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())
