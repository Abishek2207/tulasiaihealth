from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from core.database import Base


class Encounter(Base):
    __tablename__ = "encounters"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # FHIR Encounter structure
    status = Column(String, nullable=False)  # planned, arrived, in-progress, finished, cancelled
    
    # Class of encounter (ambulatory, inpatient, emergency, etc.)
    class_code = Column(String, nullable=False)
    class_display = Column(String)
    
    # Participants
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timing
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True))
    
    # Location
    location_id = Column(String)  # Reference to location resource
    location_display = Column(String)
    
    # Reason for encounter (coded)
    reason_codes = Column(JSON)  # Array of coding objects
    reason_text = Column(Text)
    
    # Diagnosis and findings
    diagnosis_codes = Column(JSON)  # Dual-coded diagnosis
    findings = Column(JSON)  # Clinical findings
    
    # Treatment plan
    treatment_plan = Column(JSON)
    medications = Column(JSON)
    procedures = Column(JSON)
    
    # AYUSH specific
    ayush_system = Column(String)  # ayurveda, siddha, unani, yoga, etc.
    prakriti = Column(String)  # Body constitution
    vikriti = Column(String)  # Current imbalance
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    provider = relationship("User", back_populates="encounters")
