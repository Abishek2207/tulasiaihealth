"""
NAMASTE Terminology Ingestion Service for TulsiHealth
Reads namaste.csv and populates the database with AYUSH disease codes and symptoms.
"""

import csv
import logging
from typing import Dict, Any, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from api.models.database import NamasteCode, ConceptMap

logger = logging.getLogger(__name__)

class NamasteService:
    """Service for managing NAMASTE (AYUSH) terminology"""

    async def ingest_from_csv(self, csv_path: str, db: AsyncSession) -> Dict[str, Any]:
        """Ingest NAMASTE codes from CSV into the database"""
        try:
            path = Path(csv_path)
            if not path.exists():
                raise FileNotFoundError(f"CSV file not found at {csv_path}")

            stats = {"total": 0, "created": 0, "errors": []}
            
            with open(path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    try:
                        stats["total"] += 1
                        code = row.get("NAMASTE_Code")
                        if not code:
                            continue

                        # Check if already exists
                        stmt = select(NamasteCode).where(NamasteCode.code == code)
                        existing = await db.execute(stmt)
                        if existing.scalar_one_or_none():
                            continue

                        # Helper to map AYUSH_System to DB enum
                        system_map = {
                            "Ayurveda": "AYU",
                            "Siddha": "SID",
                            "Unani": "UNA",
                            "Homeopathy": "HOM"
                        }
                        raw_system = row.get("AYUSH_System", "Ayurveda")
                        db_system = system_map.get(raw_system, "AYU")

                        # Parse symptoms
                        symptoms_raw = row.get("Symptoms", "")
                        symptoms = [s.strip() for s in symptoms_raw.split(",")] if symptoms_raw else []

                        # Create entry
                        new_code = NamasteCode(
                            code=code,
                            system=db_system,
                            name_en=row.get("Disease_Name", ""),
                            symptoms=symptoms,
                            tm2_code=row.get("ICD11_Code"), # Often TM2 mappings are in the same column in early datasets
                            icd11_mms_code=row.get("ICD11_Code"),
                            category=row.get("Category", "General"),
                            description=f"Ingested from official NAMASTE dataset. Severity: {row.get('Severity', 'N/A')}"
                        )
                        
                        db.add(new_code)
                        stats["created"] += 1

                    except Exception as e:
                        logger.error(f"Error processing row {row}: {e}")
                        stats["errors"].append(str(e))

            await db.commit()
            return stats

        except Exception as e:
            logger.error(f"NAMASTE ingestion failed: {e}")
            await db.rollback()
            raise

    async def get_all_codes(self, db: AsyncSession) -> List[NamasteCode]:
        """Fetch all NAMASTE codes"""
        result = await db.execute(select(NamasteCode))
        return list(result.scalars().all())

    async def search_by_symptoms(self, query_symptoms: List[str], db: AsyncSession) -> List[NamasteCode]:
        """Search for NAMASTE codes by symptom keywords"""
        # This is a basic implementation; in production, use full-text search or vector embeddings
        all_codes = await self.get_all_codes(db)
        matches = []
        
        for code_obj in all_codes:
            if not code_obj.symptoms:
                continue
                
            match_count = 0
            for qs in query_symptoms:
                if any(qs.lower() in s.lower() for s in code_obj.symptoms):
                    match_count += 1
            
            if match_count > 0:
                matches.append(code_obj)
        
        return matches

namaste_service = NamasteService()
