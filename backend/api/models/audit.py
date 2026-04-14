from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import hashlib
import uuid

from core.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # FHIR AuditEvent structure
    action = Column(String, nullable=False)  # C = Create, R = Read, U = Update, D = Delete, E = Execute
    recorded = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    outcome = Column(String, nullable=False)  # 0 = success, 4 = minor failure, 8 = serious failure, 12 = major failure
    
    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.id"))
    user_role = Column(String)
    user_name = Column(String)
    
    # Network information
    source_ip = Column(String)
    user_agent = Column(Text)
    
    # What was acted upon
    resource_type = Column(String)  # Patient, Condition, Encounter, etc.
    resource_id = Column(String)  # UUID of the resource
    resource_url = Column(String)  # Full URL to the resource
    
    # Operation details
    operation = Column(String)  # API endpoint called
    method = Column(String)  # HTTP method
    request_data = Column(JSON)  # Request payload
    response_data = Column(JSON)  # Response data (sanitized)
    
    # Security and compliance
    purpose_of_use = Column(String)  # Treatment, Payment, Operations, Research, etc.
    consent_reference = Column(String)  # Reference to consent that authorized this action
    
    # Blockchain-like hash chain for immutability
    previous_hash = Column(String)  # Hash of the previous audit event
    current_hash = Column(String, nullable=False)  # Hash of this event
    hash_chain_valid = Column(String, default="pending")  # pending, valid, broken
    
    # ISO 22600 compliance
    policy_id = Column(String)  # Policy that was applied
    decision = Column(String)  # Permit, Deny
    obligations = Column(JSON)  # Any obligations that were applied
    
    # Patient context (if applicable)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Relationships
    user = relationship("User", back_populates="audit_events")
    patient = relationship("Patient")
    
    def calculate_hash(self):
        """Calculate SHA-256 hash of this audit event"""
        hash_data = {
            "id": self.id,
            "uuid": self.uuid,
            "action": self.action,
            "recorded": self.recorded.isoformat() if self.recorded else None,
            "user_id": self.user_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "operation": self.operation,
            "previous_hash": self.previous_hash
        }
        
        hash_string = str(sorted(hash_data.items()))
        return hashlib.sha256(hash_string.encode()).hexdigest()
    
    def validate_hash_chain(self, previous_event_hash):
        """Validate that this event correctly follows the previous one"""
        calculated_hash = self.calculate_hash()
        return calculated_hash == self.current_hash and self.previous_hash == previous_event_hash
