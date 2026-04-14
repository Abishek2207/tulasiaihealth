from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fhir.resources.bundle import Bundle
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.encounter import Encounter
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.coding import Coding
from fhir.resources.codeableconcept import CodeableConcept

from api.models.patient import Patient as DBPatient
from api.models.condition import Condition as DBCondition
from api.models.encounter import Encounter as DBEncounter
from api.models.codesystem import CodeSystem as DBCodeSystem, Concept as DBConcept
from services.terminology_service import terminology_service


class FHIRService:
    def __init__(self):
        pass
    
    def validate_bundle(self, bundle: Bundle) -> Dict[str, Any]:
        """Validate FHIR Bundle structure and content"""
        
        errors = []
        warnings = []
        
        # Check bundle type
        if bundle.type not in ["collection", "document", "message", "transaction", "transaction-response", "batch", "batch-response"]:
            errors.append(f"Invalid bundle type: {bundle.type}")
        
        # Check for required resources
        if not bundle.entry:
            errors.append("Bundle must contain at least one entry")
        
        # Validate each entry
        for i, entry in enumerate(bundle.entry or []):
            resource = entry.resource
            
            if not resource.resource_type:
                errors.append(f"Entry {i}: Missing resource type")
                continue
            
            # Validate dual coding for Condition resources
            if resource.resource_type == "Condition":
                condition_validation = self.validate_dual_coded_condition(resource)
                if not condition_validation["valid"]:
                    errors.extend([f"Entry {i}: {error}" for error in condition_validation["errors"]])
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def validate_dual_coded_condition(self, condition: Condition) -> Dict[str, Any]:
        """Validate that a Condition has proper dual coding"""
        
        errors = []
        
        if not condition.code:
            errors.append("Condition must have a code")
            return {"valid": False, "errors": errors}
        
        # Check for AYUSH coding
        ayush_coding = None
        icd11_coding = None
        
        for coding in condition.code.coding or []:
            system = coding.system or ""
            
            if "namaste" in system.lower() or "tm2" in system.lower():
                ayush_coding = coding
            elif "icd" in system.lower():
                icd11_coding = coding
        
        if not ayush_coding:
            errors.append("Condition must have AYUSH coding (NAMASTE or TM2)")
        
        if not icd11_coding:
            errors.append("Condition must have ICD-11 coding")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def validate_icd11_clusters(self, bundle: Bundle) -> Dict[str, Any]:
        """Validate ICD-11 cluster rules"""
        
        errors = []
        
        # Collect all ICD-11 codes in the bundle
        icd11_codes = []
        
        for entry in bundle.entry or []:
            resource = entry.resource
            
            if resource.resource_type == "Condition" and resource.code:
                for coding in resource.code.coding or []:
                    if "icd" in (coding.system or "").lower():
                        icd11_codes.append(coding.code)
        
        # Validate cluster rules (simplified for demo)
        # In production, this would use actual ICD-11 cluster validation logic
        cluster_rules = {
            # Example: Certain codes must be clustered together
            "1A00": ["1A01", "1A02"],  # Fever cluster
            "5A00": ["5A01", "5A02"],  # Diabetes cluster
        }
        
        for code in icd11_codes:
            if code in cluster_rules:
                # Check if related codes are present
                related_codes = cluster_rules[code]
                missing_codes = [rc for rc in related_codes if rc not in icd11_codes]
                
                if missing_codes:
                    errors.append(f"ICD-11 code {code} requires related codes: {missing_codes}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def ingest_bundle(self, bundle: Bundle, user_id: int, db: Session) -> Dict[str, Any]:
        """Ingest a validated FHIR Bundle into the database"""
        
        ingested_resources = []
        
        for entry in bundle.entry or []:
            resource = entry.resource
            
            if resource.resource_type == "Patient":
                # Create or update patient
                patient = self.create_patient_from_fhir(resource, user_id, db)
                ingested_resources.append({"type": "Patient", "id": str(patient.id)})
            
            elif resource.resource_type == "Condition":
                # Create condition
                condition = self.create_condition_from_fhir(resource, user_id, db)
                ingested_resources.append({"type": "Condition", "id": str(condition.id)})
            
            elif resource.resource_type == "Encounter":
                # Create encounter
                encounter = self.create_encounter_from_fhir(resource, user_id, db)
                ingested_resources.append({"type": "Encounter", "id": str(encounter.id)})
        
        return {
            "success": True,
            "ingested_count": len(ingested_resources),
            "resources": ingested_resources
        }
    
    def create_patient_from_fhir(self, fhir_patient: Patient, user_id: int, db: Session) -> DBPatient:
        """Create database Patient from FHIR Patient"""
        
        # Extract name
        name = fhir_patient.name[0] if fhir_patient.name else None
        first_name = name.given[0] if name and name.given else ""
        last_name = name.family if name else ""
        
        # Extract identifiers
        abha_number = None
        abha_id = None
        
        for identifier in fhir_patient.identifier or []:
            system = identifier.system or ""
            if "abha" in system.lower():
                abha_number = identifier.value
            elif "healthid" in system.lower():
                abha_id = identifier.value
        
        # Create patient
        db_patient = DBPatient(
            first_name=first_name,
            last_name=last_name,
            date_of_birth=fhir_patient.birthDate,
            gender=fhir_patient.gender,
            abha_number=abha_number,
            abha_id=abha_id,
            created_by=user_id
        )
        
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        return db_patient
    
    def create_condition_from_fhir(self, fhir_condition: Condition, user_id: int, db: Session) -> DBCondition:
        """Create database Condition from FHIR Condition"""
        
        # Extract dual coding
        ayush_code = None
        ayush_system = None
        ayush_display = None
        icd11_code = None
        icd11_display = None
        
        for coding in fhir_condition.code.coding or []:
            system = coding.system or ""
            
            if "namaste" in system.lower():
                ayush_code = coding.code
                ayush_system = "namaste"
                ayush_display = coding.display
            elif "tm2" in system.lower():
                ayush_code = coding.code
                ayush_system = "tm2"
                ayush_display = coding.display
            elif "icd" in system.lower():
                icd11_code = coding.code
                icd11_display = coding.display
        
        # Create condition
        db_condition = DBCondition(
            patient_id=1,  # This should be extracted from the Condition subject reference
            clinical_status=fhir_condition.clinicalStatus.coding[0].code if fhir_condition.clinicalStatus else "active",
            verification_status=fhir_condition.verificationStatus.coding[0].code if fhir_condition.verificationStatus else "confirmed",
            ayush_code=ayush_code,
            ayush_system=ayush_system,
            ayush_display=ayush_display,
            icd11_code=icd11_code,
            icd11_display=icd11_display,
            recorder_id=user_id,
            recorded_date=datetime.utcnow()
        )
        
        db.add(db_condition)
        db.commit()
        db.refresh(db_condition)
        
        return db_condition
    
    def create_encounter_from_fhir(self, fhir_encounter: Encounter, user_id: int, db: Session) -> DBEncounter:
        """Create database Encounter from FHIR Encounter"""
        
        # Extract participant information
        provider_id = user_id  # Default to current user
        
        # Extract patient reference
        patient_reference = fhir_encounter.subject.reference if fhir_encounter.subject else ""
        patient_id = int(patient_reference.split("/")[-1]) if "/" in patient_reference else 1
        
        # Create encounter
        db_encounter = DBEncounter(
            patient_id=patient_id,
            provider_id=provider_id,
            status=fhir_encounter.status,
            class_code=fhir_encounter.class_.code if fhir_encounter.class_ else "AMB",
            period_start=fhir_encounter.period.start if fhir_encounter.period else datetime.utcnow()
        )
        
        db.add(db_encounter)
        db.commit()
        db.refresh(db_encounter)
        
        return db_encounter
    
    def convert_patient_to_fhir(self, db_patient: DBPatient) -> Dict[str, Any]:
        """Convert database Patient to FHIR Patient"""
        
        identifiers = []
        
        if db_patient.abha_number:
            identifiers.append(Identifier(
                system="https://healthid.ndhm.gov.in/",
                value=db_patient.abha_number,
                type={"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "AB"}]}
            ))
        
        if db_patient.patient_id:
            identifiers.append(Identifier(
                system="http://tulsihealth.in/fhir/sid/patient-id",
                value=db_patient.patient_id,
                type={"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MR"}]}
            ))
        
        fhir_patient = Patient(
            id=str(db_patient.uuid),
            identifier=identifiers,
            name=[HumanName(
                family=db_patient.last_name,
                given=[db_patient.first_name]
            )],
            gender=db_patient.gender,
            birthDate=db_patient.date_of_birth.strftime("%Y-%m-%d")
        )
        
        return fhir_patient.dict()
    
    def convert_condition_to_fhir(self, db_condition: DBCondition) -> Dict[str, Any]:
        """Convert database Condition to FHIR Condition with dual coding"""
        
        # Build coding list
        codings = []
        
        # Add AYUSH coding
        if db_condition.ayush_code:
            ayush_system = "http://tulsihealth.in/fhir/CodeSystem/namaste"
            if db_condition.ayush_system == "tm2":
                ayush_system = "http://tulsihealth.in/fhir/CodeSystem/tm2"
            
            codings.append(Coding(
                system=ayush_system,
                code=db_condition.ayush_code,
                display=db_condition.ayush_display
            ))
        
        # Add ICD-11 coding
        if db_condition.icd11_code:
            codings.append(Coding(
                system="http://id.who.int/icd/release/11/mms",
                code=db_condition.icd11_code,
                display=db_condition.icd11_display
            ))
        
        fhir_condition = Condition(
            id=str(db_condition.uuid),
            clinicalStatus={"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": db_condition.clinical_status}]},
            verificationStatus={"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status", "code": db_condition.verification_status}]},
            category=[{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-category", "code": "problem-list-item"}]}],
            code={"coding": codings},
            subject={"reference": f"Patient/{db_condition.patient_id}"},
            recorded=db_condition.recorded_date.isoformat() if db_condition.recorded_date else None
        )
        
        return fhir_condition.dict()
    
    def get_bundle(self, bundle_id: str, user_id: int, db: Session) -> Optional[Dict[str, Any]]:
        """Retrieve a FHIR Bundle by ID"""
        
        # For now, return a simple bundle
        # In production, this would retrieve stored bundles from the database
        
        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "collection",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entry": []
        }


# Global FHIR service instance
fhir_service = FHIRService()
