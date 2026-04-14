"""
FHIR Routes for TulsiHealth
Handles FHIR R4 resource generation and validation
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from api.models.database import User, Patient, Encounter, Condition, UserRole
from api.services.fhir_service import fhir_service
from api.database import get_db
from api.deps import get_current_active_user, require_role

router = APIRouter()


class BundleRequest(BaseModel):
    """Request model for FHIR Bundle"""
    encounter_id: str
    include_patient: bool = True
    include_conditions: bool = True
    include_practitioner: bool = True


class ResourceValidationRequest(BaseModel):
    """Request model for resource validation"""
    resource: Dict[str, Any]


@router.get("/CodeSystem/namaste", response_model=Dict[str, Any])
async def get_namaste_codesystem(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get NAMASTE CodeSystem FHIR resource"""
    try:
        codesystem = fhir_service.generate_namaste_codesystem()
        return fhir_service.serialize_fhir_resource(codesystem)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate NAMASTE CodeSystem: {str(e)}"
        )


@router.get("/ConceptMap/namaste-to-tm2", response_model=Dict[str, Any])
async def get_namaste_to_tm2_conceptmap(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get NAMASTE to ICD-11 TM2 ConceptMap FHIR resource"""
    try:
        conceptmap = fhir_service.generate_conceptmap_namaste_to_tm2()
        return fhir_service.serialize_fhir_resource(conceptmap)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ConceptMap: {str(e)}"
        )


@router.get("/Patient/{patient_id}", response_model=Dict[str, Any])
async def get_patient_fhir(
    patient_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get FHIR Patient resource"""
    try:
        # Get patient
        result = await db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Generate FHIR resource
        fhir_patient = fhir_service.generate_patient_resource(patient)
        return fhir_service.serialize_fhir_resource(fhir_patient)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate FHIR Patient: {str(e)}"
        )


@router.get("/Condition/{condition_id}", response_model=Dict[str, Any])
async def get_condition_fhir(
    condition_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get FHIR Condition resource with dual coding"""
    try:
        # Get condition
        result = await db.execute(
            select(Condition).where(Condition.id == condition_id)
        )
        condition = result.scalar_one_or_none()
        
        if not condition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Condition not found"
            )
        
        # Get patient for context
        patient_result = await db.execute(
            select(Patient).where(Patient.id == condition.patient_id)
        )
        patient = patient_result.scalar_one_or_none()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated patient not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Generate FHIR resource
        fhir_condition = fhir_service.generate_condition_resource(condition, patient)
        return fhir_service.serialize_fhir_resource(fhir_condition)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate FHIR Condition: {str(e)}"
        )


@router.get("/Encounter/{encounter_id}", response_model=Dict[str, Any])
async def get_encounter_fhir(
    encounter_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get FHIR Encounter resource"""
    try:
        # Get encounter
        result = await db.execute(
            select(Encounter).where(Encounter.id == encounter_id)
        )
        encounter = result.scalar_one_or_none()
        
        if not encounter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Encounter not found"
            )
        
        # Get patient and doctor
        patient_result = await db.execute(
            select(Patient).where(Patient.id == encounter.patient_id)
        )
        patient = patient_result.scalar_one_or_none()
        
        doctor_result = await db.execute(
            select(User).where(User.id == encounter.doctor_id)
        )
        doctor = doctor_result.scalar_one_or_none()
        
        if not patient or not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated patient or doctor not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Generate FHIR resource
        fhir_encounter = fhir_service.generate_encounter_resource(encounter, patient, doctor)
        return fhir_service.serialize_fhir_resource(fhir_encounter)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate FHIR Encounter: {str(e)}"
        )


@router.post("/Bundle", response_model=Dict[str, Any])
async def create_fhir_bundle(
    request: BundleRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create FHIR Bundle containing encounter resources"""
    try:
        # Get encounter
        result = await db.execute(
            select(Encounter).where(Encounter.id == request.encounter_id)
        )
        encounter = result.scalar_one_or_none()
        
        if not encounter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Encounter not found"
            )
        
        # Get patient and doctor
        patient_result = await db.execute(
            select(Patient).where(Patient.id == encounter.patient_id)
        )
        patient = patient_result.scalar_one_or_none()
        
        doctor_result = await db.execute(
            select(User).where(User.id == encounter.doctor_id)
        )
        doctor = doctor_result.scalar_one_or_none()
        
        if not patient or not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated patient or doctor not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Generate FHIR Bundle
        fhir_bundle = fhir_service.generate_bundle_resource(encounter, patient, doctor)
        return fhir_service.serialize_fhir_resource(fhir_bundle)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate FHIR Bundle: {str(e)}"
        )


@router.post("/validate", response_model=Dict[str, Any])
async def validate_fhir_resource(
    request: ResourceValidationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Validate FHIR resource structure"""
    try:
        is_valid = fhir_service.validate_fhir_resource(request.resource)
        
        return {
            "valid": is_valid,
            "resource_type": request.resource.get("resourceType", "unknown"),
            "validation_details": "Resource structure validation completed"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )


@router.get("/ValueSet/namaste-ayurveda", response_model=Dict[str, Any])
async def get_namaste_ayurveda_valueset(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get NAMASTE Ayurveda ValueSet"""
    try:
        # Get Ayurveda codes
        from api.models.database import NamasteCode
        result = await db.execute(
            select(NamasteCode).where(NamasteCode.system == "AYU")
        )
        ayurveda_codes = result.scalars().all()
        
        # Create ValueSet
        includes = []
        for code in ayurveda_codes:
            concept = {
                "code": code.code,
                "display": code.name_en,
                "designation": [
                    {
                        "language": "en",
                        "value": code.description
                    }
                ]
            }
            if code.name_ta:
                concept["designation"].append({
                    "language": "ta",
                    "value": code.name_ta
                })
            if code.name_hi:
                concept["designation"].append({
                    "language": "hi",
                    "value": code.name_hi
                })
            includes.append(concept)
        
        valueset = {
            "resourceType": "ValueSet",
            "id": "namaste-ayurveda",
            "name": "NAMASTE Ayurveda Codes",
            "status": "active",
            "date": "2024-01-01",
            "publisher": "Ministry of Ayush",
            "description": "ValueSet containing NAMASTE Ayurveda terminology codes",
            "compose": {
                "include": [
                    {
                        "system": "http://tulsihealth.in/fhir/CodeSystem/namaste",
                        "filter": [
                            {
                                "property": "system",
                                "op": "=",
                                "value": "AYU"
                            }
                        ],
                        "concept": includes[:100]  # Limit to 100 for demo
                    }
                ]
            }
        }
        
        return valueset
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ValueSet: {str(e)}"
        )


@router.get("/CapabilityStatement", response_model=Dict[str, Any])
async def get_capability_statement():
    """Get FHIR Capability Statement"""
    try:
        capability_statement = {
            "resourceType": "CapabilityStatement",
            "id": "tulsihealth-capability",
            "status": "active",
            "date": "2024-01-01",
            "publisher": "TulsiHealth",
            "kind": "instance",
            "implementation": {
                "description": "TulsiHealth - India's First AYUSH + ICD-11 Dual-Coding EMR Platform",
                "url": "http://localhost:8000"
            },
            "fhirVersion": "4.0.1",
            "format": ["application/fhir+json", "application/fhir+xml"],
            "rest": [
                {
                    "mode": "server",
                    "resource": [
                        {
                            "type": "Patient",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        },
                        {
                            "type": "Condition",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        },
                        {
                            "type": "Encounter",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        },
                        {
                            "type": "Bundle",
                            "operation": [
                                {
                                    "name": "create",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-create"
                                }
                            ]
                        },
                        {
                            "type": "CodeSystem",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        },
                        {
                            "type": "ConceptMap",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        },
                        {
                            "type": "ValueSet",
                            "operation": [
                                {
                                    "name": "read",
                                    "definition": "http://hl7.org/fhir/OperationDefinition/Resource-read"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        return capability_statement
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CapabilityStatement: {str(e)}"
        )


@router.get("/metadata", response_model=Dict[str, Any])
async def get_fhir_metadata():
    """Get FHIR server metadata"""
    try:
        metadata = {
            "resourceType": "Parameters",
            "parameter": [
                {
                    "name": "version",
                    "valueString": "4.0.1"
                },
                {
                    "name": "release",
                    "valueString": "R4"
                },
                {
                    "name": "implementation",
                    "valueString": "TulsiHealth FHIR Server"
                },
                {
                    "name": "formats",
                    "valueString": "application/fhir+json"
                },
                {
                    "name": "features",
                    "valueString": "dual-coding, ayush-terminology, rag-diagnosis"
                }
            ]
        }
        
        return metadata
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get metadata: {str(e)}"
        )


@router.post("/AuditEvent", response_model=Dict[str, Any])
async def create_audit_event(
    audit_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create FHIR AuditEvent"""
    try:
        action = audit_data.get("action", "unknown")
        resource_type = audit_data.get("resource_type", "unknown")
        resource_id = audit_data.get("resource_id", "unknown")
        
        # Generate AuditEvent
        audit_event = fhir_service.generate_audit_event(
            current_user, action, resource_type, resource_id
        )
        
        return fhir_service.serialize_fhir_resource(audit_event)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create AuditEvent: {str(e)}"
        )


@router.get("/search/patient", response_model=List[Dict[str, Any]])
async def search_patients_fhir(
    name: Optional[str] = None,
    tulsi_id: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Search for patients and return FHIR Patient resources"""
    try:
        # Check permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Build query
        query = select(Patient).limit(limit)
        
        if name:
            query = query.where(Patient.name.ilike(f"%{name}%"))
        if tulsi_id:
            query = query.where(Patient.tulsi_id == tulsi_id)
        if state:
            query = query.where(Patient.state == state.upper())
        
        result = await db.execute(query)
        patients = result.scalars().all()
        
        # Generate FHIR resources
        fhir_patients = []
        for patient in patients:
            fhir_patient = fhir_service.generate_patient_resource(patient)
            fhir_patients.append(fhir_service.serialize_fhir_resource(fhir_patient))
        
        return fhir_patients
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Patient search failed: {str(e)}"
        )
