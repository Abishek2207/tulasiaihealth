"""
Database seeding script for TulsiHealth
Populates NamasteCode + ICD11Code + ConceptMap tables from namaste.csv
"""
import asyncio
import csv
import os
import sys
from datetime import datetime, timezone

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from api.database import AsyncSessionLocal, init_db
from api.models.database import NamasteCode, ICD11Code, ConceptMap, EquivalenceType


def get_csv_path() -> str:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return os.path.join(base, 'datasets', 'namaste.csv')


SYSTEM_MAP = {
    'Ayurveda': 'AYU',
    'Siddha': 'SID',
    'Unani': 'UNA',
    'Homeopathy': 'HOM',
    'Yoga': 'AYU',  # Map to closest
    'Naturopathy': 'AYU',
}


async def seed_data():
    csv_path = get_csv_path()
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV not found at {csv_path}")
        sys.exit(1)

    print("Initializing database...")
    await init_db()

    seeded_namaste = 0
    seeded_icd = 0
    seeded_maps = 0

    async with AsyncSessionLocal() as session:
        print(f"Reading NAMASTE dataset from: {csv_path}")
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"Found {len(rows)} rows. Seeding...")

        for i, row in enumerate(rows):
            try:
                # Determine AYUSH system
                raw_system = row.get('AYUSH_System', 'Ayurveda').strip()
                system = SYSTEM_MAP.get(raw_system, 'AYU')

                namaste_code_val = row.get('NAMASTE_Code', '').strip()
                icd_code_val     = row.get('ICD11_Code', '').strip()
                disease_name     = row.get('Disease_Name', '').strip()
                icd_title        = row.get('ICD11_Title', disease_name).strip()
                symptoms_raw     = row.get('Symptoms', '').strip()
                symptoms_list    = [s.strip() for s in symptoms_raw.split(',') if s.strip()]

                if not namaste_code_val or not disease_name:
                    continue

                # ---- ICD11Code ----
                icd_model = None
                if icd_code_val:
                    result = await session.execute(
                        select(ICD11Code).where(ICD11Code.code == icd_code_val)
                    )
                    icd_model = result.scalar_one_or_none()
                    if not icd_model:
                        icd_model = ICD11Code(
                            code=icd_code_val,
                            linearization="MMS",
                            title=icd_title,
                            version="2024-01",
                            last_synced=datetime.now(timezone.utc),
                        )
                        session.add(icd_model)
                        await session.flush()
                        seeded_icd += 1

                # ---- NamasteCode ----
                result = await session.execute(
                    select(NamasteCode).where(NamasteCode.code == namaste_code_val)
                )
                namaste_model = result.scalar_one_or_none()
                if not namaste_model:
                    namaste_model = NamasteCode(
                        code=namaste_code_val,
                        system=system,
                        name_en=disease_name,
                        description=disease_name,
                        symptoms=symptoms_list,
                        tm2_code=icd_code_val if icd_code_val else None,
                        icd11_mms_code=icd_code_val if icd_code_val else None,
                    )
                    session.add(namaste_model)
                    await session.flush()
                    seeded_namaste += 1

                # ---- ConceptMap ----
                if icd_model:
                    result = await session.execute(
                        select(ConceptMap).where(
                            ConceptMap.namaste_id == namaste_model.id,
                            ConceptMap.mms_id == icd_model.id,
                        )
                    )
                    if not result.scalar_one_or_none():
                        mapping = ConceptMap(
                            namaste_id=namaste_model.id,
                            mms_id=icd_model.id,
                            tm2_code=icd_code_val,
                            equivalence=EquivalenceType.EQUIVALENT,
                            confidence_score=0.9,
                        )
                        session.add(mapping)
                        seeded_maps += 1

                if (i + 1) % 50 == 0:
                    await session.commit()
                    print(f"  Progress: {i + 1}/{len(rows)} rows processed...")

            except Exception as e:
                print(f"  WARNING: Skipped row {i+1} ({row.get('NAMASTE_Code','?')}): {e}")
                await session.rollback()
                continue

        await session.commit()

    print(f"\n✅ Seeding complete!")
    print(f"   NamasteCode rows: {seeded_namaste}")
    print(f"   ICD11Code rows:   {seeded_icd}")
    print(f"   ConceptMap rows:  {seeded_maps}")


if __name__ == "__main__":
    asyncio.run(seed_data())
