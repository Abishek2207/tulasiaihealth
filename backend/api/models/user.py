from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    
    # Role-based access
    role = Column(String, nullable=False)  # doctor, clinician, patient, admin
    
    # ABHA integration
    abha_id = Column(String, unique=True, index=True)
    abha_number = Column(String, unique=True, index=True)
    
    # Face recognition
    face_embedding = Column(Text)  # JSON string of face embedding
    
    # Profile
    phone = Column(String)
    address = Column(Text)
    qualifications = Column(ARRAY(String))  # For doctors
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    patients = relationship("Patient", back_populates="created_by_user")
    encounters = relationship("Encounter", back_populates="provider")
    audit_events = relationship("AuditEvent", back_populates="user")
