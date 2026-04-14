from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from core.database import Base


class Condition(Base):
    __tablename__ = "conditions"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Patient and encounter
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(Integer, ForeignKey("encounters.id"))
    
    # FHIR Condition structure
    clinical_status = Column(String, nullable=False)  # active, recurrence, remission, resolved
    verification_status = Column(String, nullable=False)  # confirmed, provisional, differential, refuted
    
    # Categories
    category = Column(String)  # problem-list-item, encounter-diagnosis, etc.
    severity = Column(String)  # mild, moderate, severe
    
    # Dual coding - core feature
    # AYUSH coding (NAMASTE/TM2)
    ayush_code = Column(String)  # NAMASTE or TM2 code
    ayush_system = Column(String)  # namaste, tm2
    ayush_display = Column(String)
    
    # ICD-11 coding
    icd11_code = Column(String)  # ICD-11 MMS code
    icd11_display = Column(String)
    icd11_linearization = Column(String)  # The linearization (e.g., "mms")
    
    # ICD-11 cluster information
    icd11_cluster_code = Column(String)
    icd11_cluster_display = Column(String)
    
    # Translation confidence
    translation_confidence = Column(String)  # high, medium, low
    equivalence_score = Column(String)  # exact, narrow, wide, inexact
    
    # Clinical details
    onset_date = Column(DateTime(timezone=True))
    abatement_date = Column(DateTime(timezone=True))
    
    # Body site and laterality
    body_site = Column(JSON)
    laterality = Column(String)
    
    # Clinical notes
    clinical_notes = Column(Text)
    provider_notes = Column(Text)
    
    # AYUSH specific details
    dosha_involved = Column(JSON)  # vata, pitta, kapha
    srotas_affected = Column(JSON)  # Channels affected
    agni_status = Column(String)  # Digestive fire status
    
    # Metadata
    recorded_date = Column(DateTime(timezone=True), server_default=func.now())
    recorder_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    patient = relationship("Patient", back_populates="conditions")
    encounter = relationship("Encounter")
    recorder = relationship("User")
