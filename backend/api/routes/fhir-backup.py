from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from fhir.resources.bundle import Bundle
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.encounter import Encounter
from fhir.resources.codesystem import CodeSystem
from fhir.resources.valueset import ValueSet
from fhir.resources.conceptmap import ConceptMap
from fhir.resources.provenance import Provenance
from fhir.resources.auditevent import AuditEvent as FHIRAuditEvent

from core.database import get_db
from api.models.user import User
from api.models.patient import Patient as DBPatient
from api.models.condition import Condition as DBCondition
from api.models.encounter import Encounter as DBEncounter
from api.models.codesystem import CodeSystem as DBCodeSystem, Concept as DBConcept
from services.auth_service import get_current_user
from services.audit_service import audit_service
from services.fhir_service import fhir_service


router = APIRouter()


class BundleUpload(BaseModel):
    bundle: Dict[str, Any]


class BundleValidationResponse(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    bundle_id: Optional[str] = None


@router.post("/bundle/upload", response_model=BundleValidationResponse)
async def upload_fhir_bundle(
    bundle_data: BundleUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate and ingest a FHIR Bundle with dual-coded resources"""
    
    try:
        # Parse FHIR Bundle
        bundle = Bundle(**bundle_data.bundle)
        
        # Validate bundle structure
        validation_result = fhir_service.validate_bundle(bundle)
        
        if not validation_result["valid"]:
            return BundleValidationResponse(**validation_result)
        
        # Check ICD-11 cluster rules
        cluster_validation = fhir_service.validate_icd11_clusters(bundle)
        
        if not cluster_validation["valid"]:
            validation_result["errors"].extend(cluster_validation["errors"])
            return BundleValidationResponse(**validation_result)
        
        # Ingest bundle to database
        ingestion_result = fhir_service.ingest_bundle(bundle, current_user.id, db)
        
        # Log audit event
        audit_service.log_event(
            db=db,
            user_id=current_user.id,
            action="C",
            resource_type="Bundle",
            resource_id=bundle.id or "unknown",
            operation="upload_bundle",
            outcome="0",
            request_data=bundle_data.bundle
        )
        
        return BundleValidationResponse(
            valid=True,
            errors=[],
            warnings=validation_result.get("warnings", []),
            bundle_id=bundle.id
        )
        
    except Exception as e:
        # Log audit event for failure
        audit_service.log_event(
            db=db,
            user_id=current_user.id,
            action="C",
            resource_type="Bundle",
            resource_id="unknown",
            operation="upload_bundle",
            outcome="8",  # serious failure
            request_data=bundle_data.bundle
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bundle validation failed: {str(e)}"
        )


@router.get("/Bundle/{bundle_id}")
async def get_fhir_bundle(
    bundle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a FHIR Bundle by ID"""
    
    bundle = fhir_service.get_bundle(bundle_id, current_user.id, db)
    
    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found"
        )
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="R",
        resource_type="Bundle",
        resource_id=bundle_id,
        operation="get_bundle",
        outcome="0"
    )
    
    return bundle


@router.get("/Patient/{patient_id}")
async def get_fhir_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get FHIR Patient resource"""
    
    # Convert patient_id to database ID if needed
    db_patient = db.query(DBPatient).filter(
        (DBPatient.uuid == patient_id) | (DBPatient.patient_id == patient_id)
    ).first()
    
    if not db_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Check access permissions
    if current_user.role == "patient" and db_patient.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Convert to FHIR Patient
    fhir_patient = fhir_service.convert_patient_to_fhir(db_patient)
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="R",
        resource_type="Patient",
        resource_id=str(db_patient.id),
        operation="get_fhir_patient",
        outcome="0",
        patient_id=db_patient.id
    )
    
    return fhir_patient


@router.get("/Condition/{condition_id}")
async def get_fhir_condition(
    condition_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get FHIR Condition resource with dual coding"""
    
    condition = db.query(DBCondition).filter(
        (DBCondition.uuid == condition_id) | (DBCondition.id == int(condition_id) if condition_id.isdigit() else False)
    ).first()
    
    if not condition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Condition not found"
        )
    
    # Check access permissions
    if current_user.role == "patient" and condition.patient.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Convert to FHIR Condition
    fhir_condition = fhir_service.convert_condition_to_fhir(condition)
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="R",
        resource_type="Condition",
        resource_id=str(condition.id),
        operation="get_fhir_condition",
        outcome="0",
        patient_id=condition.patient_id
    )
    
    return fhir_condition


@router.post("/Condition")
async def create_fhir_condition(
    condition_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new FHIR Condition with dual coding"""
    
    try:
        # Validate condition data
        condition = Condition(**condition_data)
        
        # Check required dual coding
        validation = fhir_service.validate_dual_coded_condition(condition)
        
        if not validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid dual coding: {validation['errors']}"
            )
        
        # Create condition in database
        db_condition = fhir_service.create_condition_from_fhir(condition, current_user.id, db)
        
        # Log audit event
        audit_service.log_event(
            db=db,
            user_id=current_user.id,
            action="C",
            resource_type="Condition",
            resource_id=str(db_condition.id),
            operation="create_condition",
            outcome="0",
            patient_id=db_condition.patient_id,
            request_data=condition_data
        )
        
        return fhir_service.convert_condition_to_fhir(db_condition)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create condition: {str(e)}"
        )


@router.get("/CodeSystem")
async def list_fhir_codesystems(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all FHIR CodeSystems"""
    
    code_systems = db.query(DBCodeSystem).filter(
        DBCodeSystem.status == "active"
    ).all()
    
    fhir_codesystems = []
    for cs in code_systems:
        fhir_cs = CodeSystem(
            id=str(cs.id),
            url=cs.url,
            name=cs.name,
            title=cs.title,
            status=cs.status,
            version=cs.version,
            publisher=cs.publisher,
            description=cs.description,
            content=cs.content,
            count=cs.count
        )
        fhir_codesystems.append(fhir_cs.dict())
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(fhir_codesystems),
        "entry": [
            {
                "resource": cs,
                "search": {
                    "mode": "match"
                }
            }
            for cs in fhir_codesystems
        ]
    }


@router.get("/CodeSystem/{codesystem_id}")
async def get_fhir_codesystem(
    codesystem_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get FHIR CodeSystem with concepts"""
    
    codesystem = db.query(DBCodeSystem).filter(
        (DBCodeSystem.id == int(codesystem_id) if codesystem_id.isdigit() else False) |
        (DBCodeSystem.name == codesystem_id)
    ).first()
    
    if not codesystem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CodeSystem not found"
        )
    
    # Get concepts
    concepts = db.query(DBConcept).filter(
        DBConcept.codesystem_id == codesystem.id,
        DBConcept.status == "active"
    ).all()
    
    # Convert to FHIR CodeSystem
    fhir_cs = CodeSystem(
        id=str(codesystem.id),
        url=codesystem.url,
        name=codesystem.name,
        title=codesystem.title,
        status=codesystem.status,
        version=codesystem.version,
        publisher=codesystem.publisher,
        description=codesystem.description,
        content=codesystem.content,
        count=len(concepts),
        concept=[
            {
                "code": concept.code,
                "display": concept.display,
                "definition": concept.definition,
                "designation": concept.designation or [],
                "property": [
                    {
                        "code": key,
                        "value": value
                    }
                    for key, value in (concept.property or {}).items()
                ]
            }
            for concept in concepts
        ]
    )
    
    return fhir_cs.dict()


@router.get("/ValueSet/{valueset_id}/$expand")
async def expand_fhir_valueset(
    valueset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Expand a FHIR ValueSet"""
    
    # For now, handle simple ValueSet expansion
    # In production, this would handle complex ValueSet definitions
    
    if "namaste" in valueset_id.lower():
        # Expand NAMASTE ValueSet
        codesystem = db.query(DBCodeSystem).filter(DBCodeSystem.name == "NAMASTE").first()
        
        if not codesystem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NAMASTE CodeSystem not found"
            )
        
        concepts = db.query(DBConcept).filter(
            DBConcept.codesystem_id == codesystem.id,
            DBConcept.status == "active"
        ).all()
        
        expansion = []
        for concept in concepts:
            expansion.append({
                "code": concept.code,
                "display": concept.display,
                "system": codesystem.url,
                "designation": concept.designation or []
            })
        
        return {
            "resourceType": "ValueSet",
            "id": valueset_id,
            "expansion": {
                "identifier": f"urn:uuid:{valueset_id}",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "total": len(expansion),
                "contains": expansion
            }
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ValueSet not found"
        )


@router.get("/AuditEvent")
async def list_fhir_audit_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """List FHIR AuditEvents (for compliance)"""
    
    # Only admins and doctors can see audit events
    if current_user.role not in ["admin", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    from api.models.audit import AuditEvent as DBAuditEvent
    
    audit_events = db.query(DBAuditEvent).order_by(
        DBAuditEvent.recorded.desc()
    ).limit(limit).all()
    
    fhir_audit_events = []
    for event in audit_events:
        fhir_event = FHIRAuditEvent(
            id=str(event.id),
            action=event.action,
            recorded=event.recorded.isoformat(),
            outcome=event.outcome,
            agent=[{
                "who": {"reference": f"User/{event.user_id}"},
                "name": event.user_name
            }] if event.user_id else [],
            entity=[{
                "what": {"reference": f"{event.resource_type}/{event.resource_id}"},
                "type": event.resource_type,
                "lifecycle": event.action
            }],
            source={
                "site": "TulsiHealth",
                "observer": {"display": "TulsiHealth API"}
            }
        )
        fhir_audit_events.append(fhir_event.dict())
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(fhir_audit_events),
        "entry": [
            {
                "resource": event,
                "search": {
                    "mode": "match"
                }
            }
            for event in fhir_audit_events
        ]
    }
