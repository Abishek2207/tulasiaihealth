"""
SQLAlchemy 2.0 Async Models for TulsiHealth
SQLite-compatible production models with proper relationships and constraints
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid

from sqlalchemy import (
    String, Text, DateTime, Boolean, Integer, Float,
    ForeignKey, Index, CheckConstraint, UniqueConstraint, JSON, Uuid
)
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Base class for all models"""
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


class UserRole(str, Enum):
    USER = "user"
    DOCTOR = "doctor"
    CLINICIAN = "clinician"
    ADMIN = "admin"


class HospitalType(str, Enum):
    AYUSH = "AYUSH"
    ALLOPATHY = "Allopathy"
    BOTH = "Both"


class EquivalenceType(str, Enum):
    EQUIVALENT = "equivalent"
    WIDER = "wider"
    NARROWER = "narrower"


class ConsentPurpose(str, Enum):
    TREATMENT = "treatment"
    RESEARCH = "research"
    EMERGENCY = "emergency"
    AUDIT = "audit"


class Hospital(Base):
    __tablename__ = "hospitals"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    registration_number: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="hospital")
    encounters: Mapped[List["Encounter"]] = relationship("Encounter", back_populates="hospital")

    __table_args__ = (
        Index("idx_hospitals_state", "state"),
        Index("idx_hospitals_type", "type"),
    )


class User(Base):
    __tablename__ = "users"

    abha_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.USER)
    state: Mapped[str] = mapped_column(String(2), nullable=False, default="KA")

    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("hospitals.id"),
        nullable=True
    )

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    face_embedding: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    hospital: Mapped[Optional["Hospital"]] = relationship("Hospital", back_populates="users")
    encounters: Mapped[List["Encounter"]] = relationship("Encounter", back_populates="doctor")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")
    rag_sessions: Mapped[List["RAGSession"]] = relationship("RAGSession", back_populates="user")

    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_abha_id", "abha_id"),
        Index("idx_users_role_state", "role", "state"),
        CheckConstraint("role IN ('user', 'doctor', 'clinician', 'admin')", name="check_user_role"),
    )


class Patient(Base):
    __tablename__ = "patients"

    tulsi_id: Mapped[str] = mapped_column(String(25), unique=True, nullable=False, index=True)
    abha_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False, default="M")
    blood_group: Mapped[Optional[str]] = mapped_column(String(5))
    state: Mapped[str] = mapped_column(String(2), nullable=False, default="KA")

    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(Text)

    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(255))
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20))
    emergency_contact_relation: Mapped[Optional[str]] = mapped_column(String(50))

    qr_token: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    qr_expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    allergies: Mapped[Optional[List[str]]] = mapped_column(JSON)
    chronic_conditions: Mapped[Optional[List[str]]] = mapped_column(JSON)
    current_medications: Mapped[Optional[List[str]]] = mapped_column(JSON)

    # Relationships
    encounters: Mapped[List["Encounter"]] = relationship("Encounter", back_populates="patient")
    conditions: Mapped[List["Condition"]] = relationship("Condition", back_populates="patient")
    consents: Mapped[List["Consent"]] = relationship("Consent", back_populates="patient")
    rag_sessions: Mapped[List["RAGSession"]] = relationship("RAGSession", back_populates="patient")

    __table_args__ = (
        Index("idx_patients_tulsi_id", "tulsi_id"),
        Index("idx_patients_abha_id", "abha_id"),
        Index("idx_patients_name", "name"),
        CheckConstraint("gender IN ('M', 'F', 'O')", name="check_gender"),
    )


class NamasteCode(Base):
    __tablename__ = "namaste_codes"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    system: Mapped[str] = mapped_column(String(10), nullable=False)  # AYU/SID/UNA/HOM
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_ta: Mapped[Optional[str]] = mapped_column(String(500))
    name_hi: Mapped[Optional[str]] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    dosha: Mapped[Optional[str]] = mapped_column(String(50))

    tm2_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    icd11_mms_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    snomed_ct: Mapped[Optional[str]] = mapped_column(String(20))
    loinc: Mapped[Optional[str]] = mapped_column(String(20))

    symptoms: Mapped[Optional[List[str]]] = mapped_column(JSON)
    signs: Mapped[Optional[List[str]]] = mapped_column(JSON)
    risk_factors: Mapped[Optional[List[str]]] = mapped_column(JSON)

    # Relationships
    conditions: Mapped[List["Condition"]] = relationship("Condition", back_populates="namaste_code")
    concept_maps_from: Mapped[List["ConceptMap"]] = relationship(
        "ConceptMap", foreign_keys="[ConceptMap.namaste_id]", back_populates="namaste_code"
    )

    __table_args__ = (
        Index("idx_namaste_system_code", "system", "code"),
        Index("idx_namaste_tm2", "tm2_code"),
        Index("idx_namaste_mms", "icd11_mms_code"),
        CheckConstraint("system IN ('AYU', 'SID', 'UNA', 'HOM')", name="check_namaste_system"),
    )


class ICD11Code(Base):
    __tablename__ = "icd11_codes"

    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    linearization: Mapped[str] = mapped_column(String(10), nullable=False, default="MMS")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    chapter: Mapped[Optional[str]] = mapped_column(String(20))
    parent_code: Mapped[Optional[str]] = mapped_column(String(20))
    depth: Mapped[Optional[int]] = mapped_column(Integer)
    is_leaf: Mapped[bool] = mapped_column(Boolean, default=True)

    version: Mapped[str] = mapped_column(String(20), nullable=False, default="2024-01")
    last_synced: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    api_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Relationships
    concept_maps_to: Mapped[List["ConceptMap"]] = relationship(
        "ConceptMap", foreign_keys="[ConceptMap.mms_id]", back_populates="mms_code_obj"
    )

    __table_args__ = (
        Index("idx_icd11_linearization", "linearization"),
        Index("idx_icd11_chapter", "chapter"),
        CheckConstraint("linearization IN ('TM2', 'MMS')", name="check_icd11_linearization"),
    )


class ConceptMap(Base):
    __tablename__ = "concept_maps"

    namaste_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("namaste_codes.id"),
        nullable=False
    )
    tm2_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    mms_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("icd11_codes.id"),
        nullable=True
    )
    equivalence: Mapped[str] = mapped_column(String(20), nullable=False, default=EquivalenceType.EQUIVALENT)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.9)

    mapping_notes: Mapped[Optional[str]] = mapped_column(Text)
    validated_by: Mapped[Optional[str]] = mapped_column(String(255))
    validation_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    namaste_code: Mapped["NamasteCode"] = relationship(
        "NamasteCode", foreign_keys=[namaste_id], back_populates="concept_maps_from"
    )
    mms_code_obj: Mapped[Optional["ICD11Code"]] = relationship(
        "ICD11Code", foreign_keys=[mms_id], back_populates="concept_maps_to"
    )

    __table_args__ = (
        Index("idx_conceptmap_namaste", "namaste_id"),
        Index("idx_conceptmap_mms", "mms_id"),
        CheckConstraint(
            "confidence_score >= 0 AND confidence_score <= 1", name="check_confidence_score"
        ),
        CheckConstraint(
            "equivalence IN ('equivalent', 'wider', 'narrower')", name="check_equivalence"
        ),
    )


class Encounter(Base):
    __tablename__ = "encounters"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    hospital_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id"), nullable=True
    )

    encounter_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    encounter_type: Mapped[str] = mapped_column(String(50), default="OPD")
    chief_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    history_of_present_illness: Mapped[Optional[str]] = mapped_column(Text)
    physical_examination: Mapped[Optional[str]] = mapped_column(Text)

    vitals: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    lab_results: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    fhir_bundle: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    status: Mapped[str] = mapped_column(String(20), default="completed")
    is_cluster_valid: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="encounters")
    doctor: Mapped["User"] = relationship("User", back_populates="encounters")
    hospital: Mapped[Optional["Hospital"]] = relationship("Hospital", back_populates="encounters")
    conditions: Mapped[List["Condition"]] = relationship("Condition", back_populates="encounter")

    __table_args__ = (
        Index("idx_encounters_patient", "patient_id"),
        Index("idx_encounters_doctor", "doctor_id"),
        Index("idx_encounters_date", "encounter_date"),
        Index("idx_encounters_status", "status"),
    )


class Condition(Base):
    __tablename__ = "conditions"

    encounter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("encounters.id"), nullable=False
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    namaste_code_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("namaste_codes.id"), nullable=False
    )

    tm2_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    mms_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)

    severity: Mapped[Optional[str]] = mapped_column(String(20))
    onset_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="active")

    is_cluster_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    validation_notes: Mapped[Optional[str]] = mapped_column(Text)

    fhir_condition: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    # Relationships
    encounter: Mapped["Encounter"] = relationship("Encounter", back_populates="conditions")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="conditions")
    namaste_code: Mapped["NamasteCode"] = relationship("NamasteCode", back_populates="conditions")

    __table_args__ = (
        Index("idx_conditions_encounter", "encounter_id"),
        Index("idx_conditions_patient", "patient_id"),
        Index("idx_conditions_namaste", "namaste_code_id"),
        Index("idx_conditions_tm2", "tm2_code"),
        Index("idx_conditions_mms", "mms_code"),
        CheckConstraint(
            "severity IN ('mild', 'moderate', 'severe') OR severity IS NULL", name="check_severity"
        ),
        CheckConstraint(
            "status IN ('active', 'resolved', 'chronic')", name="check_condition_status"
        ),
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    operation: Mapped[Optional[str]] = mapped_column(String(100))
    outcome: Mapped[Optional[str]] = mapped_column(String(50))

    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    user_agent: Mapped[Optional[str]] = mapped_column(Text)

    prev_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    curr_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)

    old_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    new_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_resource", "resource_type", "resource_id"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_timestamp", "created_at"),
    )


class Consent(Base):
    __tablename__ = "consent"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )

    granted_to_role: Mapped[str] = mapped_column(String(50), nullable=False)
    purpose: Mapped[str] = mapped_column(String(20), nullable=False, default=ConsentPurpose.TREATMENT)
    scope: Mapped[str] = mapped_column(Text, nullable=False)

    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    version: Mapped[int] = mapped_column(Integer, default=1)
    granted_by: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="consents")

    __table_args__ = (
        Index("idx_consent_patient", "patient_id"),
        Index("idx_consent_role", "granted_to_role"),
        Index("idx_consent_purpose", "purpose"),
        Index("idx_consent_expiry", "expires_at"),
        CheckConstraint(
            "purpose IN ('treatment', 'research', 'emergency', 'audit')", name="check_consent_purpose"
        ),
    )


class RAGSession(Base):
    __tablename__ = "rag_sessions"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patients.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    query: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en")

    retrieved_chunks: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON)
    response: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    model_used: Mapped[str] = mapped_column(String(100), nullable=False, default="groq")

    response_time_ms: Mapped[Optional[int]] = mapped_column(Integer)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float)

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="rag_sessions")
    user: Mapped["User"] = relationship("User", back_populates="rag_sessions")

    __table_args__ = (
        Index("idx_rag_patient", "patient_id"),
        Index("idx_rag_user", "user_id"),
        Index("idx_rag_language", "language"),
        Index("idx_rag_timestamp", "created_at"),
        CheckConstraint("language IN ('en', 'ta', 'hi')", name="check_rag_language"),
    )
