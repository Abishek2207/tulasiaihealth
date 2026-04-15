"""
TulsiHealth — Premium Clinical Seeding Engine (Production Ready)
Generates high-fidelity clinical data across Hospitals, Doctors, Patients, and Encounters.
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

# Password hashing context (matching AuthService)
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database import AsyncSessionLocal, engine
from api.models.database import (
    Base, User, Hospital, Patient, Encounter, Condition, 
    NamasteCode, ICD11Code, ConceptMap, UserRole, EquivalenceType
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Mock Data Sources ---

HOSPITAL_DATA = [
    {"name": "Siddha Central Research Institute", "type": "AYUSH", "state": "TN", "city": "Chennai"},
    {"name": "Tulsi Holistic AYU Care", "type": "AYUSH", "state": "KA", "city": "Bengaluru"},
    {"name": "All-India Institute of Ayurveda", "type": "AYUSH", "state": "DL", "city": "New Delhi"},
    {"name": "National Institute of Unani Medicine", "type": "AYUSH", "state": "KA", "city": "Bengaluru"},
    {"name": "Appollo Integrative Health", "type": "Both", "state": "MH", "city": "Mumbai"},
]

DOCTOR_NAMES = [
    "Dr. Rajesh Kannan", "Dr. Meena Iyer", "Dr. Amit Sharma", 
    "Dr. Sarah Khan", "Dr. Lakshmi Menon", "Dr. Vikrant Singh",
    "Dr. Anjali Gupta", "Dr. Senthil Kumar", "Dr. Zoya Ahmed", "Dr. Rahul Verma"
]

FIRST_NAMES = ["Arjun", "Deepika", "Karthik", "Sneha", "Rohan", "Priya", "Vikram", "Ananya", "Suresh", "Kavitha", "Manoj", "Shanti", "Vijay", "Aswathi", "Ganesh", "Divya"]
LAST_NAMES = ["Nair", "Iyer", "Reddy", "Patel", "Sharma", "Menon", "Gupta", "Deshmukh", "Pillai", "Kaur"]

BLOOD_GROUPS = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"]
GENDERS = ["M", "F", "O"]
STATES = ["KA", "TN", "MH", "DL", "KL", "AP", "TS", "GJ"]

# --- Helper Functions ---

def generate_abha_id():
    return f"{random.randint(10, 99)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

def generate_phone():
    return f"+91 {random.randint(6000, 9999)} {random.randint(100, 999)} {random.randint(100, 999)}"

async def clear_database():
    logger.info("Dropping and recreating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

# --- Seeding Logic ---

async def seed_production_data():
    await clear_database()
    
    async with AsyncSessionLocal() as session:
        # 1. Seed Hospitals
        hospitals = []
        for h_info in HOSPITAL_DATA:
            h = Hospital(**h_info)
            session.add(h)
            hospitals.append(h)
        await session.flush()
        logger.info(f"Seeded {len(hospitals)} hospitals.")

        # 2. Seed Doctors (Users)
        doctors = []
        password_hash = pwd_context.hash("doctor123")
        for i, name in enumerate(DOCTOR_NAMES):
            email = f"doctor{i+1}@tulsihealth.in"
            role = UserRole.DOCTOR if i < 8 else UserRole.ADMIN
            doc = User(
                name=name,
                email=email,
                password_hash=password_hash,
                role=role,
                hospital_id=hospitals[i % len(hospitals)].id,
                is_active=True,
                is_verified=True,
                state=hospitals[i % len(hospitals)].state
            )
            session.add(doc)
            doctors.append(doc)
        await session.flush()
        logger.info(f"Seeded {len(doctors)} doctor/admin accounts.")

        # 3. Seed NAMASTE & ICD-11 Baseline (Minimal for referencing)
        # We'll use the codes from our implementation logic
        nc1 = NamasteCode(code="AYU-D-0001", system="AYU", name_en="Vataja Jwara", description="Fever with Vata imbalance", category="Jwara")
        nc2 = NamasteCode(code="AYU-D-0201", system="AYU", name_en="Prameha", description="Metabolic syndrome / Diabetes", category="Prameha")
        nc3 = NamasteCode(code="AYU-D-0301", system="AYU", name_en="Amavata", description="Rheumatoid condition", category="Vata Disorders")
        icd1 = ICD11Code(code="1D01", title="Fever of unknown origin", linearization="MMS")
        icd2 = ICD11Code(code="5A11", title="Type 2 Diabetes Mellitus", linearization="MMS")
        icd3 = ICD11Code(code="FA20", title="Rheumatoid Arthritis", linearization="MMS")
        
        session.add_all([nc1, nc2, nc3, icd1, icd2, icd3])
        await session.flush()
        
        codes = [nc1, nc2, nc3]
        icds = [icd1, icd2, icd3]

        # 4. Seed Patients
        patients = []
        for i in range(50):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            state = random.choice(STATES)
            tulsi_id = f"TH-2024-{state}-{random.randint(100000, 999999)}"
            dob = datetime.now(timezone.utc) - timedelta(days=random.randint(365*18, 365*75))
            
            p = Patient(
                tulsi_id=tulsi_id,
                abha_id=generate_abha_id(),
                name=f"{first} {last}",
                date_of_birth=dob,
                gender=random.choice(GENDERS),
                blood_group=random.choice(BLOOD_GROUPS),
                state=state,
                phone=generate_phone(),
                qr_token=str(uuid.uuid4()),
                qr_expiry=datetime.now(timezone.utc) + timedelta(days=365)
            )
            session.add(p)
            patients.append(p)
        await session.flush()
        logger.info(f"Seeded {len(patients)} patients.")

        # 5. Seed Encounters
        total_encounters = 200
        for i in range(total_encounters):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            date = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 180))
            
            # Simulated Vitals
            vitals = {
                "heart_rate": random.randint(60, 110),
                "bp_systolic": random.randint(110, 150),
                "bp_diastolic": random.randint(70, 95),
                "temp_f": round(random.uniform(97.5, 102.5), 1),
                "spo2": random.randint(94, 99)
            }
            
            encounter = Encounter(
                patient_id=patient.id,
                doctor_id=doctor.id,
                hospital_id=doctor.hospital_id,
                encounter_date=date,
                chief_complaint=random.choice(["High fever with chills", "Chronic joint pain", "Excessive thirst and fatigue", "Dry cough", "Lower back pain"]),
                vitals=vitals,
                status="completed"
            )
            session.add(encounter)
            await session.flush()
            
            # Add Condition for the encounter
            code_idx = random.randint(0, len(codes)-1)
            condition = Condition(
                encounter_id=encounter.id,
                patient_id=patient.id,
                namaste_code_id=codes[code_idx].id,
                tm2_code=codes[code_idx].tm2_code,
                mms_code=icds[code_idx].code,
                severity=random.choice(["mild", "moderate", "severe"]),
                status="active" if random.random() > 0.3 else "resolved"
            )
            session.add(condition)

        await session.commit()
        logger.info(f"Seeded {total_encounters} encounters with conditions.")

    logger.info("Production seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_production_data())
