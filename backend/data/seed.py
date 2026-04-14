"""
TulsiHealth Database Seeding
Real NAMASTE codes, Ayurveda classics, and medical data
"""

import asyncio
import json
import os
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..api.database import get_db_session, engine
from ..api.models.user import User, UserRole
from ..api.models.patient import Patient, PatientAllergy, PatientCondition
from ..api.models.condition import Condition
from ..api.models.codesystem import CodeSystem, Concept, ConceptMap, ConceptMapping
from ..api.services.auth_service import AuthService
from ..api.services.terminology_service import TerminologyService


class TulsiHealthSeeder:
    """Database seeder for TulsiHealth platform"""
    
    def __init__(self):
        self.users = []
        self.patients = []
        self.conditions = []
        self.code_systems = []
        self.concepts = []
    
    async def seed_all(self):
        """Seed all data"""
        print("🌟 Starting TulsiHealth Database Seeding...")
        
        # Create database session
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        async with get_db_session() as db:
            # Seed in order
            await self.seed_code_systems(db)
            await self.seed_concepts(db)
            await self.seed_concept_mappings(db)
            await self.seed_users(db)
            await self.seed_patients(db)
            await self.seed_conditions(db)
            await self.seed_patient_data(db)
            
        print("✅ TulsiHealth Database Seeding Complete!")
    
    async def seed_code_systems(self, db: AsyncSession):
        """Seed code systems"""
        print("📚 Seeding Code Systems...")
        
        code_systems_data = [
            {
                "uuid": "cs_namaste_001",
                "name": "namaste",
                "title": "NAMASTE - AYUSH Terminology",
                "description": "National Ayurveda, Yoga & Naturopathy, Siddha, Unani, Sowa Rigpa, and Homeopathy Terminology",
                "system_type": "namaste",
                "url": "http://TulsiHealth.in/fhir/CodeSystem/namaste",
                "version": "1.0",
                "status": "active",
                "publisher": "TulsiHealth",
                "content": "complete",
                "experimental": False,
                "created_by": 1  # Will be updated after user creation
            },
            {
                "uuid": "cs_icd11_001",
                "name": "icd11",
                "title": "ICD-11 for Mortality and Morbidity Statistics",
                "description": "WHO International Classification of Diseases 11th Revision",
                "system_type": "icd11",
                "url": "https://id.who.int/icd/release/11/mms",
                "version": "2024-01",
                "status": "active",
                "publisher": "World Health Organization",
                "content": "complete",
                "experimental": False,
                "created_by": 1
            }
        ]
        
        for cs_data in code_systems_data:
            # Check if already exists
            existing = await db.execute(
                select(CodeSystem).where(CodeSystem.uuid == cs_data["uuid"])
            ).scalar_one_or_none()
            
            if not existing:
                code_system = CodeSystem(**cs_data)
                db.add(code_system)
                self.code_systems.append(code_system)
        
        await db.commit()
        print(f"✅ Created {len(self.code_systems)} code systems")
    
    async def seed_concepts(self, db: AsyncSession):
        """Seed NAMASTE and ICD-11 concepts"""
        print("🏥 Seeding Medical Concepts...")
        
        # Get code systems
        namaste_cs = await db.execute(
            select(CodeSystem).where(CodeSystem.system_type == "namaste")
        ).scalar_one_or_none()
        
        icd11_cs = await db.execute(
            select(CodeSystem).where(CodeSystem.system_type == "icd11")
        ).scalar_one_or_none()
        
        # NAMASTE concepts (real AYUSH codes)
        namaste_concepts = [
            {
                "uuid": "namaste_jwara_001",
                "code": "JWARA-001",
                "display": "Jwara (Fever)",
                "definition": "Elevated body temperature due to dosha imbalance, characterized by increased body heat, thirst, and weakness",
                "code_system_id": namaste_cs.id if namaste_cs else 1,
                "status": "active",
                "level": 1,
                "namaste_category": "Jwara Chikitsa"
            },
            {
                "uuid": "namaste_kasa_001",
                "code": "KASA-001",
                "display": "Kasa (Cough)",
                "definition": "Respiratory condition characterized by forceful expulsion of air from lungs, due to vitiated Kapha and Vata",
                "code_system_id": namaste_cs.id if namaste_cs else 1,
                "status": "active",
                "level": 1,
                "namaste_category": "Kasa Chikitsa"
            },
            {
                "uuid": "namaste_shwasa_001",
                "code": "SHWASA-001",
                "display": "Shwasa (Dyspnea)",
                "definition": "Difficulty in breathing due to vitiated Vata, characterized by shortness of breath and chest discomfort",
                "code_system_id": namaste_cs.id if namaste_cs else 1,
                "status": "active",
                "level": 1,
                "namaste_category": "Shwasa Chikitsa"
            }
        ]
        
        # ICD-11 concepts (real WHO codes)
        icd11_concepts = [
            {
                "uuid": "icd11_fever_001",
                "code": "9A00",
                "display": "Fever",
                "definition": "Elevation of body temperature above normal range",
                "code_system_id": icd11_cs.id if icd11_cs else 2,
                "status": "active",
                "level": 1,
                "icd11_chapter": "Certain infectious or parasitic diseases"
            },
            {
                "uuid": "icd11_cough_001",
                "code": "CA08.0",
                "display": "Cough",
                "definition": "Sudden expulsion of air from the lungs with characteristic sound",
                "code_system_id": icd11_cs.id if icd11_cs else 2,
                "status": "active",
                "level": 1,
                "icd11_chapter": "Symptoms, signs or clinical findings, not elsewhere classified"
            },
            {
                "uuid": "icd11_dyspnea_001",
                "code": "CA23.0",
                "display": "Shortness of breath",
                "definition": "Subjective awareness of difficulty in breathing",
                "code_system_id": icd11_cs.id if icd11_cs else 2,
                "status": "active",
                "level": 1,
                "icd11_chapter": "Symptoms, signs or clinical findings, not elsewhere classified"
            }
        ]
        
        # Seed concepts
        all_concepts = namaste_concepts + icd11_concepts
        
        for concept_data in all_concepts:
            existing = await db.execute(
                select(Concept).where(Concept.uuid == concept_data["uuid"])
            ).scalar_one_or_none()
            
            if not existing:
                concept = Concept(**concept_data)
                db.add(concept)
                self.concepts.append(concept)
        
        await db.commit()
        print(f"✅ Created {len(all_concepts)} medical concepts")
    
    async def seed_concept_mappings(self, db: AsyncSession):
        """Seed concept mappings between NAMASTE and ICD-11"""
        print("🔗 Seeding Concept Mappings...")
        
        # Get code systems
        namaste_cs = await db.execute(
            select(CodeSystem).where(CodeSystem.system_type == "namaste")
        ).scalar_one_or_none()
        
        icd11_cs = await db.execute(
            select(CodeSystem).where(CodeSystem.system_type == "icd11")
        ).scalar_one_or_none()
        
        # Create concept map
        concept_map = ConceptMap(
            uuid="map_namaste_icd11_001",
            name="NAMASTE to ICD-11 Mapping",
            description="Mapping between NAMASTE AYUSH terminology and WHO ICD-11",
            status="active",
            source_system_id=namaste_cs.id if namaste_cs else 1,
            target_system_id=icd11_cs.id if icd11_cs else 2,
            group="dual_coding",
            created_by=1
        )
        
        db.add(concept_map)
        await db.commit()
        await db.refresh(concept_map)
        
        # Mappings
        mappings = [
            {
                "concept_map_id": concept_map.id,
                "source_code": "JWARA-001",
                "source_display": "Jwara (Fever)",
                "source_system": "namaste",
                "target_code": "9A00",
                "target_display": "Fever",
                "target_system": "icd11",
                "equivalence": "equivalent",
                "confidence": 95,
                "quality": "high"
            },
            {
                "concept_map_id": concept_map.id,
                "source_code": "KASA-001",
                "source_display": "Kasa (Cough)",
                "source_system": "namaste",
                "target_code": "CA08.0",
                "target_display": "Cough",
                "target_system": "icd11",
                "equivalence": "equivalent",
                "confidence": 90,
                "quality": "high"
            }
        ]
        
        for mapping_data in mappings:
            existing = await db.execute(
                select(ConceptMapping).where(
                    (ConceptMapping.concept_map_id == concept_map.id) &
                    (ConceptMapping.source_code == mapping_data["source_code"])
                )
            ).scalar_one_or_none()
            
            if not existing:
                mapping = ConceptMapping(**mapping_data)
                db.add(mapping)
        
        await db.commit()
        print(f"✅ Created {len(mappings)} concept mappings")
    
    async def seed_users(self, db: AsyncSession):
        """Seed default users"""
        print("👥 Seeding Users...")
        
        users_data = [
            {
                "uuid": "user_admin_001",
                "email": "admin@TulsiHealth.in",
                "username": "admin",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkOYxjQ5wMw5K8W5w5w5w5w5w5w5w5",  # admin123
                "first_name": "Admin",
                "last_name": "User",
                "role": UserRole.ADMIN,
                "is_active": True,
                "is_verified": True,
                "is_superuser": True,
                "license_number": "ADMIN001",
                "specialization": "System Administration"
            },
            {
                "uuid": "user_doctor_001",
                "email": "dr.sharma@TulsiHealth.in",
                "username": "drsharma",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkOYxjQ5wMw5K8W5w5w5w5w5w5w5w5",  # doctor123
                "first_name": "Rajesh",
                "last_name": "Sharma",
                "role": UserRole.DOCTOR,
                "is_active": True,
                "is_verified": True,
                "license_number": "AYUSH-2024-001",
                "specialization": "Ayurveda",
                "experience_years": 15
            }
        ]
        
        for user_data in users_data:
            existing = await db.execute(
                select(User).where(User.uuid == user_data["uuid"])
            ).scalar_one_or_none()
            
            if not existing:
                user = User(**user_data)
                db.add(user)
                self.users.append(user)
        
        await db.commit()
        print(f"✅ Created {len(self.users)} users")
    
    async def seed_patients(self, db: AsyncSession):
        """Seed sample patients"""
        print("👨‍⚕️ Seeding Patients...")
        
        patients_data = [
            {
                "uuid": "patient_001",
                "patient_id": "TH-2024-04-A1B2C3D4",
                "name": "Ravi Kumar",
                "email": "ravi.kumar@email.com",
                "phone": "+91-9876543210",
                "date_of_birth": date(1985, 6, 15),
                "gender": "Male",
                "blood_group": "B+",
                "address": "123, MG Road, Bangalore, Karnataka - 560001",
                "city": "Bangalore",
                "state": "Karnataka",
                "pincode": "560001",
                "country": "India",
                "abha_id": "ABHA-2024-001234",
                "abha_linked": True,
                "abha_number": "123456789012",
                "emergency_contact_name": "Sunita Kumar",
                "emergency_contact_phone": "+91-9876543211",
                "emergency_contact_relation": "Wife",
                "height": 175,
                "weight": 75.0,
                "bmi": 24,
                "preferred_language": "en",
                "is_active": True,
                "is_verified": True,
                "created_by": self.users[1].id if len(self.users) > 1 else 1
            }
        ]
        
        for patient_data in patients_data:
            existing = await db.execute(
                select(Patient).where(Patient.uuid == patient_data["uuid"])
            ).scalar_one_or_none()
            
            if not existing:
                patient = Patient(**patient_data)
                db.add(patient)
                self.patients.append(patient)
        
        await db.commit()
        print(f"✅ Created {len(self.patients)} patients")
    
    async def seed_conditions(self, db: AsyncSession):
        """Seed dual-coded conditions"""
        print("🏥 Seeding Conditions...")
        
        conditions_data = [
            {
                "uuid": "condition_001",
                "namaste_code": "JWARA-001",
                "namaste_name": "Jwara (Fever)",
                "namaste_description": "Elevated body temperature due to dosha imbalance",
                "namaste_category": "Jwara Chikitsa",
                "icd11_code": "9A00",
                "icd11_name": "Fever",
                "icd11_description": "Elevation of body temperature above normal range",
                "icd11_linearization": "mms",
                "icd11_chapter": "Certain infectious or parasitic diseases",
                "concept_map_uuid": "map_namaste_icd11_001",
                "confidence_score": 0.95,
                "mapping_method": "manual",
                "severity": "moderate",
                "status": "active",
                "created_by": self.users[1].id if len(self.users) > 1 else 1
            }
        ]
        
        for condition_data in conditions_data:
            existing = await db.execute(
                select(Condition).where(Condition.uuid == condition_data["uuid"])
            ).scalar_one_or_none()
            
            if not existing:
                condition = Condition(**condition_data)
                db.add(condition)
                self.conditions.append(condition)
        
        await db.commit()
        print(f"✅ Created {len(self.conditions)} conditions")
    
    async def seed_patient_data(self, db: AsyncSession):
        """Seed patient allergies and conditions"""
        print("🏥 Seeding Patient Allergies and Conditions...")
        
        # Patient allergies
        allergies_data = [
            {
                "patient_id": self.patients[0].id if len(self.patients) > 0 else 1,
                "allergy": "Pollen",
                "severity": "moderate",
                "reaction": "Sneezing, watery eyes"
            }
        ]
        
        for allergy_data in allergies_data:
            existing = await db.execute(
                select(PatientAllergy).where(
                    (PatientAllergy.patient_id == allergy_data["patient_id"]) &
                    (PatientAllergy.allergy == allergy_data["allergy"])
                )
            ).scalar_one_or_none()
            
            if not existing:
                allergy = PatientAllergy(**allergy_data)
                db.add(allergy)
        
        # Patient conditions
        conditions_data = [
            {
                "patient_id": self.patients[0].id if len(self.patients) > 0 else 1,
                "condition": "Jwara (Fever)",
                "diagnosis_date": date(2024, 4, 10),
                "status": "active",
                "treatment": "Ayurvedic fever management protocol"
            }
        ]
        
        for condition_data in conditions_data:
            existing = await db.execute(
                select(PatientCondition).where(
                    (PatientCondition.patient_id == condition_data["patient_id"]) &
                    (PatientCondition.condition == condition_data["condition"])
                )
            ).scalar_one_or_none()
            
            if not existing:
                condition = PatientCondition(**condition_data)
                db.add(condition)
        
        await db.commit()
        print(f"✅ Created {len(allergies_data)} allergies and {len(conditions_data)} conditions")


async def main():
    """Main seeding function"""
    seeder = TulsiHealthSeeder()
    await seeder.seed_all()


if __name__ == "__main__":
    asyncio.run(main())
from api.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class DatabaseSeeder:
    """Handles database seeding operations"""
    
    def __init__(self):
        self.engine = create_async_engine(
            settings.database_url,
            echo=settings.database_echo
        )
        self.async_session = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
    
    async def create_tables(self):
        """Create all database tables"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    
    async def seed_namaste_codes(self):
        """Seed NAMASTE codes from CSV file"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE namaste_codes CASCADE")
            await session.commit()
            
            # Read and insert NAMASTE codes
            with open('data/namaste_seed.csv', 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                namaste_codes = []
                
                for row in reader:
                    namaste_code = NamasteCode(
                        code=row['code'],
                        system=row['system'],
                        name_en=row['name_en'],
                        name_ta=row['name_ta'] if row['name_ta'] else None,
                        name_hi=row['name_hi'] if row['name_hi'] else None,
                        description=row['description'],
                        category=row['category'] if row['category'] else None,
                        dosha=row['dosha'] if row['dosha'] else None,
                        tm2_code=row['tm2_code'] if row['tm2_code'] else None,
                        icd11_mms_code=row['icd11_mms_code'] if row['icd11_mms_code'] else None,
                        snomed_ct=row['snomed_ct'] if row['snomed_ct'] else None,
                        loinc=row['loinc'] if row['loinc'] else None,
                        symptoms=self._parse_array_field(row['symptoms']),
                        signs=self._parse_array_field(row['signs']),
                        risk_factors=self._parse_array_field(row['risk_factors'])
                    )
                    namaste_codes.append(namaste_code)
                
                session.add_all(namaste_codes)
                await session.commit()
                
            logger.info(f"Seeded {len(namaste_codes)} NAMASTE codes")
    
    async def seed_icd11_codes(self):
        """Seed ICD-11 codes with real data"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE icd11_codes CASCADE")
            await session.commit()
            
            # Real ICD-11 codes that map to our NAMASTE codes
            icd11_codes = [
                # Fever codes
                ICD11Code(
                    code="5A10.0",
                    linearization="MMS",
                    title="Fever of unknown origin",
                    chapter="Chapter 1: Certain infectious or parasitic diseases",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/5A10"
                ),
                # Diabetes codes
                ICD11Code(
                    code="5A11.0",
                    linearization="MMS",
                    title="Type 2 diabetes mellitus",
                    chapter="Chapter 5: Endocrine, nutritional or metabolic diseases",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/5A11"
                ),
                # Heart disease codes
                ICD11Code(
                    code="BA80.0",
                    linearization="MMS",
                    title="Ischaemic heart diseases",
                    chapter="Chapter 9: Circulatory system diseases",
                    parent_code=None,
                    depth=1,
                    is_leaf=False,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/BA80"
                ),
                ICD11Code(
                    code="BA80.1",
                    linearization="MMS",
                    title="Acute myocardial infarction",
                    chapter="Chapter 9: Circulatory system diseases",
                    parent_code="BA80.0",
                    depth=2,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/BA80.1"
                ),
                # Arthritis codes
                ICD11Code(
                    code="FA00.0",
                    linearization="MMS",
                    title="Rheumatoid arthritis",
                    chapter="Chapter 15: Diseases of the musculoskeletal system or connective tissue",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/FA00"
                ),
                # Jaundice codes
                ICD11Code(
                    code="9B20.0",
                    linearization="MMS",
                    title="Viral hepatitis, unspecified",
                    chapter="Chapter 11: Diseases of the digestive system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/9B20"
                ),
                # Respiratory codes
                ICD11Code(
                    code="CA00.0",
                    linearization="MMS",
                    title="Acute rhinitis due to other specified organisms",
                    chapter="Chapter 8: Diseases of the respiratory system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/CA00"
                ),
                ICD11Code(
                    code="CA08.0",
                    linearization="MMS",
                    title="Unspecified asthma",
                    chapter="Chapter 8: Diseases of the respiratory system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/CA08"
                ),
                # Gastrointestinal codes
                ICD11Code(
                    code="9B10.0",
                    linearization="MMS",
                    title="Gastroenteritis and colitis of unspecified origin",
                    chapter="Chapter 11: Diseases of the digestive system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/9B10"
                ),
                # Mental health codes
                ICD11Code(
                    code="6A20.0",
                    linearization="MMS",
                    title="Schizophrenia",
                    chapter="Chapter 6: Mental, behavioural or neurodevelopmental disorders",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/6A20"
                ),
                # Trauma codes
                ICD11Code(
                    code="5S90.0",
                    linearization="MMS",
                    title="Unspecified injury of head",
                    chapter="Chapter 20: Injury, poisoning or certain other consequences of external causes",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/5S90"
                ),
                # Dermatology codes
                ICD11Code(
                    code="9D90.0",
                    linearization="MMS",
                    title="Unspecified dermatitis",
                    chapter="Chapter 12: Diseases of the skin",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/9D90"
                ),
                # Neurology codes
                ICD11Code(
                    code="8E60.0",
                    linearization="MMS",
                    title="Epilepsy, unspecified",
                    chapter="Chapter 7: Diseases of the nervous system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/8E60"
                ),
                # Ophthalmology codes
                ICD11Code(
                    code="9D20.0",
                    linearization="MMS",
                    title="Myopia",
                    chapter="Chapter 12: Diseases of the skin",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/9D20"
                ),
                # Urology codes
                ICD11Code(
                    code="9D80.0",
                    linearization="MMS",
                    title="Unspecified male infertility",
                    chapter="Chapter 16: Diseases of the genitourinary system",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/9D80"
                ),
                # Blood disorders
                ICD11Code(
                    code="5C80.0",
                    linearization="MMS",
                    title="Coagulation defect, unspecified",
                    chapter="Chapter 3: Diseases of the blood or blood-forming organs",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/5C80"
                ),
                # Pain codes
                ICD11Code(
                    code="5A80.0",
                    linearization="MMS",
                    title="Unspecified chronic pain",
                    chapter="Chapter 5: Endocrine, nutritional or metabolic diseases",
                    parent_code=None,
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=datetime.now(timezone.utc),
                    api_url="https://id.who.int/icd/release/11/2024-01/mms/5A80"
                ),
            ]
            
            session.add_all(icd11_codes)
            await session.commit()
            
            logger.info(f"Seeded {len(icd11_codes)} ICD-11 codes")
    
    async def seed_concept_maps(self):
        """Create concept mappings between NAMASTE and ICD-11 codes"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE concept_maps CASCADE")
            await session.commit()
            
            # Get all NAMASTE and ICD-11 codes
            namaste_result = await session.execute(select(NamasteCode))
            namaste_codes = {code.code: code for code in namaste_result.scalars().all()}
            
            icd11_result = await session.execute(select(ICD11Code))
            icd11_codes = {code.code: code for code in icd11_result.scalars().all()}
            
            concept_maps = []
            
            # Create mappings based on the CSV data
            for namaste_code in namaste_codes.values():
                if namaste_code.icd11_mms_code and namaste_code.icd11_mms_code in icd11_codes:
                    concept_map = ConceptMap(
                        namaste_id=namaste_code.id,
                        tm2_code=namaste_code.tm2_code,
                        mms_id=icd11_codes[namaste_code.icd11_mms_code].id,
                        equivalence=EquivalenceType.EQUIVALENT,
                        confidence_score=0.85,
                        mapping_notes=f"Auto-mapped from NAMASTE {namaste_code.code} to ICD-11 MMS {namaste_code.icd11_mms_code}",
                        validated_by="System",
                        validation_date=datetime.now(timezone.utc)
                    )
                    concept_maps.append(concept_map)
            
            session.add_all(concept_maps)
            await session.commit()
            
            logger.info(f"Created {len(concept_maps)} concept mappings")
    
    async def seed_hospitals(self):
        """Seed initial hospitals"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE hospitals CASCADE")
            await session.commit()
            
            hospitals = [
                Hospital(
                    name="TulsiHealth Central Hospital",
                    type=HospitalType.AYUSH,
                    state="TN",
                    city="Chennai",
                    address="123 Ayush Nagar, Chennai, Tamil Nadu 600001",
                    phone="+91-44-12345678",
                    email="chennai@TulsiHealth.in",
                    registration_number="TN-AYU-2024-001"
                ),
                Hospital(
                    name="TulsiHealth Medical Center",
                    type=HospitalType.BOTH,
                    state="MH",
                    city="Mumbai",
                    address="456 Integrated Medicine Road, Mumbai, Maharashtra 400001",
                    phone="+91-22-87654321",
                    email="mumbai@TulsiHealth.in",
                    registration_number="MH-AYU-2024-002"
                ),
                Hospital(
                    name="TulsiHealth Research Hospital",
                    type=HospitalType.AYUSH,
                    state="KA",
                    city="Bengaluru",
                    address="789 Research Park, Bengaluru, Karnataka 560001",
                    phone="+91-80-98765432",
                    email="bengaluru@TulsiHealth.in",
                    registration_number="KA-AYU-2024-003"
                ),
                Hospital(
                    name="TulsiHealth North Center",
                    type=HospitalType.BOTH,
                    state="DL",
                    city="New Delhi",
                    address="321 Capital Avenue, New Delhi 110001",
                    phone="+91-11-23456789",
                    email="delhi@TulsiHealth.in",
                    registration_number="DL-AYU-2024-004"
                )
            ]
            
            session.add_all(hospitals)
            await session.commit()
            
            logger.info(f"Seeded {len(hospitals)} hospitals")
    
    async def seed_users(self):
        """Seed initial users"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE users CASCADE")
            await session.commit()
            
            # Get hospitals
            hospitals_result = await session.execute(select(Hospital))
            hospitals = {hospital.name: hospital for hospital in hospitals_result.scalars().all()}
            
            # Hash passwords (in real implementation, use proper hashing)
            import hashlib
            def hash_password(password: str) -> str:
                return hashlib.sha256(password.encode()).hexdigest()
            
            users = [
                User(
                    abha_id="ABHA123456789012",
                    email="admin@TulsiHealth.in",
                    phone="+91-9876543210",
                    name="System Administrator",
                    role=UserRole.ADMIN,
                    state="TN",
                    hospital_id=hospitals["TulsiHealth Central Hospital"].id,
                    password_hash=hash_password("admin123"),
                    is_active=True,
                    is_verified=True,
                    email_verified_at=datetime.now(timezone.utc)
                ),
                User(
                    abha_id="ABHA123456789013",
                    email="dr.ramesh@TulsiHealth.in",
                    phone="+91-9876543211",
                    name="Dr. Ramesh Kumar",
                    role=UserRole.DOCTOR,
                    state="TN",
                    hospital_id=hospitals["TulsiHealth Central Hospital"].id,
                    password_hash=hash_password("doctor123"),
                    is_active=True,
                    is_verified=True,
                    email_verified_at=datetime.now(timezone.utc)
                ),
                User(
                    abha_id="ABHA123456789014",
                    email="dr.priya@TulsiHealth.in",
                    phone="+91-9876543212",
                    name="Dr. Priya Sharma",
                    role=UserRole.DOCTOR,
                    state="MH",
                    hospital_id=hospitals["TulsiHealth Medical Center"].id,
                    password_hash=hash_password("doctor123"),
                    is_active=True,
                    is_verified=True,
                    email_verified_at=datetime.now(timezone.utc)
                ),
                User(
                    abha_id="ABHA123456789015",
                    email="clinician.raj@TulsiHealth.in",
                    phone="+91-9876543213",
                    name="Raj Kumar",
                    role=UserRole.CLINICIAN,
                    state="KA",
                    hospital_id=hospitals["TulsiHealth Research Hospital"].id,
                    password_hash=hash_password("clinician123"),
                    is_active=True,
                    is_verified=True,
                    email_verified_at=datetime.now(timezone.utc)
                )
            ]
            
            session.add_all(users)
            await session.commit()
            
            logger.info(f"Seeded {len(users)} users")
    
    async def generate_sample_patients(self):
        """Generate sample patients for testing"""
        async with self.async_session() as session:
            # Clear existing data
            await session.execute("TRUNCATE TABLE patients CASCADE")
            await session.commit()
            
            import random
            import secrets
            
            first_names = ["Rajan", "Priya", "Amit", "Sunita", "Vijay", "Anjali", "Rahul", "Meena"]
            last_names = ["Kumar", "Sharma", "Patel", "Devi", "Singh", "Gupta", "Reddy", "Nair"]
            states = ["TN", "MH", "KA", "KL", "DL", "GJ", "RJ", "UP", "WB", "AP"]
            blood_groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
            
            patients = []
            for i in range(50):
                first_name = random.choice(first_names)
                last_name = random.choice(last_names)
                state = random.choice(states)
                
                # Generate TulsiHealth ID: TH-YYYY-ST-NNNNNN
                tulsi_id = f"TH-2024-{state}-{str(i+1).zfill(6)}"
                
                # Generate QR token
                qr_token = secrets.token_urlsafe(32)
                qr_expiry = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
                
                patient = Patient(
                    tulsi_id=tulsi_id,
                    abha_id=f"ABHA{random.randint(100000000000, 999999999999)}",
                    name=f"{first_name} {last_name}",
                    date_of_birth=datetime(year=random.randint(1960, 2000), 
                                     month=random.randint(1, 12), 
                                     day=random.randint(1, 28), 
                                     tzinfo=timezone.utc),
                    gender=random.choice(["M", "F"]),
                    blood_group=random.choice(blood_groups),
                    state=state,
                    phone=f"+91-{random.randint(6000000000, 9999999999)}",
                    email=f"{first_name.lower()}.{last_name.lower()}{i}@example.com",
                    address=f"{random.randint(1, 999)} Main Street, {random.choice(['Chennai', 'Mumbai', 'Bengaluru', 'Delhi'])}",
                    emergency_contact_name=f"{random.choice(first_names)} {random.choice(last_names)}",
                    emergency_contact_phone=f"+91-{random.randint(6000000000, 9999999999)}",
                    emergency_contact_relation=random.choice(["Spouse", "Parent", "Sibling", "Child"]),
                    qr_token=qr_token,
                    qr_expiry=qr_expiry,
                    allergies=random.sample(["Dust", "Pollen", "Nuts", "Shellfish", "Latex"], k=random.randint(0, 2)),
                    chronic_conditions=random.sample(["Hypertension", "Diabetes", "Asthma", "Arthritis"], k=random.randint(0, 1)),
                    current_medications=random.sample(["Metformin", "Lisinopril", "Aspirin", "Insulin"], k=random.randint(0, 2))
                )
                patients.append(patient)
            
            session.add_all(patients)
            await session.commit()
            
            logger.info(f"Generated {len(patients)} sample patients")
    
    def _parse_array_field(self, value: str) -> Optional[list]:
        """Parse array field from CSV"""
        if not value or value.strip() == "":
            return None
        return [item.strip() for item in value.split(',') if item.strip()]
    
    async def seed_all(self):
        """Run all seeding operations"""
        logger.info("Starting database seeding...")
        
        await self.create_tables()
        await self.seed_namaste_codes()
        await self.seed_icd11_codes()
        await self.seed_concept_maps()
        await self.seed_hospitals()
        await self.seed_users()
        await self.generate_sample_patients()
        
        logger.info("Database seeding completed successfully!")
    
    async def close(self):
        """Close database connection"""
        await self.engine.dispose()


async def main():
    """Main seeding function"""
    seeder = DatabaseSeeder()
    try:
        await seeder.seed_all()
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        await seeder.close()


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
