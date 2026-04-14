from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from core.database import Base


class Consent(Base):
    __tablename__ = "consents"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Patient
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    
    # FHIR Consent structure
    status = Column(String, nullable=False)  # active, inactive, entered-in-error, rejected
    
    # Scope and category
    scope = Column(String, nullable=False)  # patient-privacy, research, treatment, etc.
    category = Column(ARRAY(String), nullable=False)  # Array of consent categories
    
    # Timing
    provision_period_start = Column(DateTime(timezone=True), nullable=False)
    provision_period_end = Column(DateTime(timezone=True))
    
    # Parties involved
    grantee_id = Column(Integer, ForeignKey("users.id"))  # Who is granted access
    grantee_role = Column(String)  # Role of the grantee
    
    # What can be accessed
    provision_type = Column(String)  # permit, deny
    provision_class = Column(ARRAY(String))  # Resource classes allowed
    provision_code = Column(JSON)  # Specific codes/data elements
    
    # Purpose of use
    purpose_of_use = Column(ARRAY(String))  # Treatment, Payment, Operations, Research, etc.
    
    # Consent management
    consent_version = Column(String, default="1.0")
    consent_text = Column(Text, nullable=False)  # Plain language consent
    policy_text = Column(Text)  # Full policy text
    
    # Digital signature
    signature_method = Column(String)  # digital, handwritten, biometric
    signature_date = Column(DateTime(timezone=True), server_default=func.now())
    signature_data = Column(JSON)  # Signature metadata
    
    # Revocation
    is_revoked = Column(Boolean, default=False)
    revoked_date = Column(DateTime(timezone=True))
    revoked_reason = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="consents")
    grantee = relationship("User")
