from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, ARRAY, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from typing import Optional
import uuid

from core.database import Base


class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # TulsiHealth Patient ID format: TH-YYYY-MM-NNNN
    patient_id = Column(String, unique=True, index=True, nullable=False)
    
    # Demographics
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String, nullable=False)  # male, female, other
    
    # Contact
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    
    # ABHA integration
    abha_number = Column(String, unique=True, index=True)
    abha_id = Column(String, unique=True, index=True)
    
    # Medical details
    blood_group = Column(String)
    allergies = Column(ARRAY(String))
    chronic_conditions = Column(ARRAY(String))
    
    # Consent and privacy
    consent_token = Column(String, unique=True, index=True)
    qr_code_data = Column(Text)  # Encrypted QR code content
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    identifiers = relationship("PatientIdentifier", back_populates="patient")
    encounters = relationship("Encounter", back_populates="patient")
    conditions = relationship("Condition", back_populates="patient")
    created_by_user = relationship("User", back_populates="patients")
    consents = relationship("Consent", back_populates="patient")


class PatientIdentifier(Base):
    __tablename__ = "patient_identifiers"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # FHIR Identifier structure
    system = Column(String, nullable=False)  # URI of the identifier system
    value = Column(String, nullable=False)  # The identifier value
    type = Column(String)  # Type of identifier (e.g., "ABHA", "Aadhaar")
    
    # Metadata
    period_start = Column(DateTime(timezone=True))
    period_end = Column(DateTime(timezone=True))
    assigner = Column(String)  # Organization that assigned the identifier
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="identifiers")
