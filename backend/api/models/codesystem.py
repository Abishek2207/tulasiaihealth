from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import Base


# Association table for concept maps
concept_map_association = Table(
    'concept_map_associations',
    Base.metadata,
    Column('source_concept_id', Integer, ForeignKey('concepts.id'), primary_key=True),
    Column('target_concept_id', Integer, ForeignKey('concepts.id'), primary_key=True),
    Column('equivalence', String),  # equivalent, wider, narrower, inexact, unmatched
    Column('confidence', String),  # high, medium, low
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)


class CodeSystem(Base):
    __tablename__ = "codesystems"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # FHIR CodeSystem structure
    url = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False)  # active, draft, retired
    
    # System details
    version = Column(String, nullable=False)
    publisher = Column(String)
    description = Column(Text)
    
    # Content
    content = Column(String, default="complete")  # complete, fragment, example, supplement
    count = Column(Integer, default=0)
    
    # Hierarchy
    hierarchy_meaning = Column(String)  # grouped, is-a, part-of
    compositional = Column(Boolean, default=False)
    
    # Source data
    source_url = Column(String)  # Original source (e.g., WHO ICD API)
    last_synced = Column(DateTime(timezone=True))
    sync_status = Column(String, default="pending")  # pending, syncing, completed, failed
    
    # AYUSH specific
    ayush_system = Column(String)  # ayurveda, siddha, unani, yoga, homeopathy
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    concepts = relationship("Concept", back_populates="codesystem")
    concept_maps = relationship("ConceptMap", back_populates="source_system")


class Concept(Base):
    __tablename__ = "concepts"
    
    id = Column(Integer, primary_key=True, index=True)
    codesystem_id = Column(Integer, ForeignKey("codesystems.id"), nullable=False)
    
    # Code structure
    code = Column(String, nullable=False, index=True)
    display = Column(String, nullable=False)
    definition = Column(Text)
    
    # Hierarchy
    parent_code = Column(String, index=True)
    level = Column(Integer, default=0)
    order = Column(Integer, default=0)
    
    # Properties
    designation = Column(JSON)  # Multiple language designations
    property = Column(JSON)  # Additional properties
    
    # Status
    status = Column(String, default="active")  # active, retired, deprecated
    deprecated_date = Column(DateTime(timezone=True))
    
    # AYUSH specific
    sanskrit_name = Column(String)
    tamil_name = Column(String)
    hindi_name = Column(String)
    english_name = Column(String)
    
    # Clinical classification
    category = Column(String)  # disease, symptom, sign, finding, etc.
    severity = Column(String)
    chronicity = Column(String)  # acute, chronic, recurrent
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    codesystem = relationship("CodeSystem", back_populates="concepts")
    
    # Self-referential relationships for mappings
    source_mappings = relationship(
        "Concept",
        secondary=concept_map_association,
        primaryjoin=(concept_map_association.c.source_concept_id == id),
        secondaryjoin=(concept_map_association.c.target_concept_id == id),
        back_populates="target_mappings"
    )
    target_mappings = relationship(
        "Concept",
        secondary=concept_map_association,
        primaryjoin=(concept_map_association.c.target_concept_id == id),
        secondaryjoin=(concept_map_association.c.source_concept_id == id),
        back_populates="source_mappings"
    )


class ConceptMap(Base):
    __tablename__ = "conceptmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # FHIR ConceptMap structure
    url = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False)
    
    # Source and target systems
    source_system_url = Column(String, nullable=False)
    target_system_url = Column(String, nullable=False)
    
    # Mapping details
    group_description = Column(Text)
    equivalence = Column(String)  # default equivalence for unmapped elements
    
    # Metadata
    version = Column(String)
    publisher = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    source_system = relationship("CodeSystem", foreign_keys=[source_system_url], back_populates="concept_maps")
