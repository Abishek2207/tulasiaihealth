"""
FHIR R4 Resource Generators for TulsiHealth
Creates valid FHIR R4 resources with dual coding support
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import json
from pydantic import ValidationError

from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.encounter import Encounter
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.codesystem import CodeSystem, CodeSystemConcept
from fhir.resources.conceptmap import ConceptMap, ConceptMapGroup, ConceptMapGroupElement
from fhir.resources.valueset import ValueSet, ValueSetComposeInclude
from fhir.resources.auditevent import AuditEvent
from fhir.resources.provenance import Provenance
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.period import Period
from fhir.resources.reference import Reference

from api.models.database import (
    User, Patient as DBPatient, Encounter as DBEncounter, 
    Condition as DBCondition, NamasteCode, ICD11Code
)
from api.core.config import get_settings

settings = get_settings()


class FHIRService:
    """Service for generating FHIR R4 resources"""
    
    def __init__(self):
        self.base_url = settings.fhir_base_url
        self.fhir_version = settings.fhir_version
        
    def generate_patient_resource(self, patient: DBPatient) -> Patient:
        """Generate FHIR Patient resource"""
        try:
            # Create identifiers
            identifiers = []
            
            # TulsiHealth ID
            tulsi_id = Identifier(
                system=f"{self.base_url}/identifier/tulsi-id",
                value=patient.tulsi_id,
                use="official"
            )
            identifiers.append(tulsi_id)
            
            # ABHA ID if available
            if patient.abha_id:
                abha_id = Identifier(
                    system="https://digitalhealth.gov.in/abha",
                    value=patient.abha_id,
                    use="secondary"
                )
                identifiers.append(abha_id)
            
            # Create human name
            name_parts = patient.name.split()
            human_name = HumanName(
                use="official",
                family=name_parts[-1] if len(name_parts) > 1 else "",
                given=name_parts[:-1] if len(name_parts) > 1 else name_parts
            )
            
            # Create patient resource
            fhir_patient = Patient(
                id=str(patient.id),
                identifier=identifiers,
                name=[human_name],
                gender=self._map_gender(patient.gender),
                birthDate=patient.date_of_birth.date(),
                deceasedBoolean=False,
                active=True,
                managingOrganization=Reference(
                    reference=f"Organization/{patient.hospital_id}" if patient.hospital_id else None
                )
            )
            
            # Add extensions for AYUSH data
            extensions = []
            
            # Blood group extension
            if patient.blood_group:
                blood_group_ext = {
                    "url": "http://hl7.org/fhir/StructureDefinition/patient-birthPlace",
                    "valueString": patient.blood_group
                }
                extensions.append(blood_group_ext)
            
            # State extension
            state_ext = {
                "url": f"{self.base_url}/StructureDefinition/patient-state",
                "valueString": patient.state
            }
            extensions.append(state_ext)
            
            if extensions:
                fhir_patient.extension = extensions
            
            # Validate resource
            fhir_patient.validate()
            
            return fhir_patient
            
        except ValidationError as e:
            raise ValueError(f"FHIR Patient validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating FHIR Patient: {e}")
    
    def generate_condition_resource(self, condition: DBCondition, patient: DBPatient) -> Condition:
        """Generate FHIR Condition resource with dual coding"""
        try:
            # Get NAMASTE code details
            namaste_code = condition.namaste_code
            
            # Create codings array with dual coding
            codings = []
            
            # NAMASTE coding
            namaste_coding = Coding(
                system=f"{self.base_url}/CodeSystem/namaste",
                code=namaste_code.code,
                display=namaste_code.name_en,
                userSelected=True
            )
            codings.append(namaste_coding)
            
            # ICD-11 TM2 coding if available
            if condition.tm2_code:
                tm2_coding = Coding(
                    system="http://id.who.int/icd/release/11/2024-01/mms",
                    code=condition.tm2_code,
                    display=f"TM2-{condition.tm2_code}",
                    userSelected=False
                )
                codings.append(tm2_coding)
            
            # ICD-11 MMS coding if available
            if condition.mms_code:
                mms_coding = Coding(
                    system="http://id.who.int/icd/release/11/2024-01/mms",
                    code=condition.mms_code,
                    display=f"MMS-{condition.mms_code}",
                    userSelected=False
                )
                codings.append(mms_coding)
            
            # Create codeable concept
            codeable_concept = CodeableConcept(
                coding=codings,
                text=namaste_code.description
            )
            
            # Create condition resource
            fhir_condition = Condition(
                id=str(condition.id),
                clinicalStatus=self._map_condition_status(condition.status),
                verificationStatus="confirmed" if condition.is_cluster_valid else "unconfirmed",
                category=[{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                        "code": "encounter-diagnosis",
                        "display": "Encounter Diagnosis"
                    }]
                }],
                code=codeable_concept,
                subject=Reference(reference=f"Patient/{patient.id}"),
                encounter=Reference(reference=f"Encounter/{condition.encounter_id}"),
                onsetDateTime=condition.onset_date.isoformat() if condition.onset_date else None,
                recordedDate=condition.created_at.isoformat(),
                severity=self._map_severity(condition.severity) if condition.severity else None
            )
            
            # Add extensions for AYUSH specific data
            extensions = []
            
            # Dosha extension
            if namaste_code.dosha:
                dosha_ext = {
                    "url": f"{self.base_url}/StructureDefinition/condition-dosha",
                    "valueString": namaste_code.dosha
                }
                extensions.append(dosha_ext)
            
            # System extension
            system_ext = {
                "url": f"{self.base_url}/StructureDefinition/condition-system",
                "valueString": namaste_code.system
            }
            extensions.append(system_ext)
            
            # Cluster validation extension
            cluster_ext = {
                "url": f"{self.base_url}/StructureDefinition/cluster-validation",
                "valueBoolean": condition.is_cluster_valid
            }
            extensions.append(cluster_ext)
            
            if extensions:
                fhir_condition.extension = extensions
            
            # Validate resource
            fhir_condition.validate()
            
            return fhir_condition
            
        except ValidationError as e:
            raise ValueError(f"FHIR Condition validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating FHIR Condition: {e}")
    
    def generate_encounter_resource(self, encounter: DBEncounter, patient: DBPatient, doctor: User) -> Encounter:
        """Generate FHIR Encounter resource"""
        try:
            # Create participant reference
            participants = []
            doctor_ref = Reference(
                reference=f"Practitioner/{doctor.id}",
                display=doctor.name
            )
            
            participant = {
                "individual": doctor_ref,
                "type": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                        "code": "ATND",
                        "display": "attender"
                    }]
                }]
            }
            participants.append(participant)
            
            # Create encounter resource
            fhir_encounter = Encounter(
                id=str(encounter.id),
                status=self._map_encounter_status(encounter.status),
                class_fhir={
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory"
                },
                subject=Reference(reference=f"Patient/{patient.id}"),
                participant=participants,
                period=Period(
                    start=encounter.encounter_date.isoformat(),
                    end=encounter.encounter_date.isoformat()  # For demo, same day
                ),
                reasonCode=[{
                    "text": encounter.chief_complaint
                }],
                serviceProvider=Reference(
                    reference=f"Organization/{encounter.hospital_id}"
                )
            )
            
            # Add extensions for AYUSH specific data
            extensions = []
            
            # Encounter type extension
            type_ext = {
                "url": f"{self.base_url}/StructureDefinition/encounter-type",
                "valueString": encounter.encounter_type
            }
            extensions.append(type_ext)
            
            # History of present illness extension
            if encounter.history_of_present_illness:
                hpi_ext = {
                    "url": f"{self.base_url}/StructureDefinition/history-present-illness",
                    "valueString": encounter.history_of_present_illness
                }
                extensions.append(hpi_ext)
            
            # Physical examination extension
            if encounter.physical_examination:
                pe_ext = {
                    "url": f"{self.base_url}/StructureDefinition/physical-examination",
                    "valueString": encounter.physical_examination
                }
                extensions.append(pe_ext)
            
            if extensions:
                fhir_encounter.extension = extensions
            
            # Validate resource
            fhir_encounter.validate()
            
            return fhir_encounter
            
        except ValidationError as e:
            raise ValueError(f"FHIR Encounter validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating FHIR Encounter: {e}")
    
    def generate_bundle_resource(self, encounter: DBEncounter, patient: DBPatient, doctor: User) -> Bundle:
        """Generate FHIR Bundle containing all encounter resources"""
        try:
            entries = []
            
            # Add patient entry
            patient_resource = self.generate_patient_resource(patient)
            patient_entry = BundleEntry(
                fullUrl=f"{self.base_url}/Patient/{patient.id}",
                resource=patient_resource,
                search={"mode": "match"}
            )
            entries.append(patient_entry)
            
            # Add encounter entry
            encounter_resource = self.generate_encounter_resource(encounter, patient, doctor)
            encounter_entry = BundleEntry(
                fullUrl=f"{self.base_url}/Encounter/{encounter.id}",
                resource=encounter_resource,
                search={"mode": "match"}
            )
            entries.append(encounter_entry)
            
            # Add practitioner entry
            practitioner_resource = self._generate_practitioner_resource(doctor)
            practitioner_entry = BundleEntry(
                fullUrl=f"{self.base_url}/Practitioner/{doctor.id}",
                resource=practitioner_resource,
                search={"mode": "match"}
            )
            entries.append(practitioner_entry)
            
            # Add condition entries
            for condition in encounter.conditions:
                condition_resource = self.generate_condition_resource(condition, patient)
                condition_entry = BundleEntry(
                    fullUrl=f"{self.base_url}/Condition/{condition.id}",
                    resource=condition_resource,
                    search={"mode": "match"}
                )
                entries.append(condition_entry)
            
            # Create bundle
            bundle = Bundle(
                id=str(uuid.uuid4()),
                type="collection",
                timestamp=datetime.now(timezone.utc).isoformat(),
                total=len(entries),
                entry=entries
            )
            
            # Validate bundle
            bundle.validate()
            
            return bundle
            
        except ValidationError as e:
            raise ValueError(f"FHIR Bundle validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating FHIR Bundle: {e}")
    
    def generate_namaste_codesystem(self) -> CodeSystem:
        """Generate FHIR CodeSystem for NAMASTE codes"""
        try:
            concepts = []
            
            # Get all NAMASTE codes
            from api.database import get_db
            from sqlalchemy.ext.asyncio import AsyncSession
            from sqlalchemy import select
            
            # This would be implemented with actual database query
            # For now, create sample concept
            sample_concept = CodeSystemConcept(
                code="AYU-D-0001",
                display="Vataja Jwara",
                definition="Vata-type fever characterized by dryness, body pain, and variable temperature"
            )
            concepts.append(sample_concept)
            
            codesystem = CodeSystem(
                id="namaste",
                name="NAMASTE",
                title="National Ayurveda, Siddha, Unani, Sowa-Rigpa, and Homeopathy Terminology Standards and Evaluation",
                status="active",
                content="complete",
                date=datetime.now(timezone.utc).date(),
                publisher="Ministry of Ayush",
                description="Standardized terminology for AYUSH systems of medicine",
                url=f"{self.base_url}/CodeSystem/namaste",
                version="1.0",
                concept=concepts
            )
            
            codesystem.validate()
            return codesystem
            
        except ValidationError as e:
            raise ValueError(f"FHIR CodeSystem validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating NAMASTE CodeSystem: {e}")
    
    def generate_conceptmap_namaste_to_tm2(self) -> ConceptMap:
        """Generate FHIR ConceptMap from NAMASTE to ICD-11 TM2"""
        try:
            group = ConceptMapGroup(
                source="http://tulsihealth.in/fhir/CodeSystem/namaste",
                target="http://id.who.int/icd/release/11/2024-01/mms",
                element=[
                    ConceptMapGroupElement(
                        code="AYU-D-0001",
                        display="Vataja Jjwara",
                        target=[
                            {
                                "code": "TM2-SC04",
                                "display": "Fever patterns",
                                "equivalence": "equivalent"
                            }
                        ]
                    )
                ]
            )
            
            conceptmap = ConceptMap(
                id="namaste-to-tm2",
                name="NAMASTE to ICD-11 TM2 Mapping",
                status="active",
                date=datetime.now(timezone.utc).date(),
                publisher="TulsiHealth",
                description="Concept mapping from NAMASTE codes to ICD-11 TM2 codes",
                sourceUri="http://tulsihealth.in/fhir/CodeSystem/namaste",
                targetUri="http://id.who.int/icd/release/11/2024-01/mms",
                group=[group]
            )
            
            conceptmap.validate()
            return conceptmap
            
        except ValidationError as e:
            raise ValueError(f"FHIR ConceptMap validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating ConceptMap: {e}")
    
    def generate_audit_event(self, user: User, action: str, resource_type: str, resource_id: str) -> AuditEvent:
        """Generate FHIR AuditEvent for audit logging"""
        try:
            audit_event = AuditEvent(
                id=str(uuid.uuid4()),
                type={
                    "system": "http://terminology.hl7.org/CodeSystem/audit-event-type",
                    "code": "rest",
                    "display": "Restful Operation"
                },
                subtype=[
                    {
                        "system": "http://hl7.org/fhir/restful-interaction",
                        "code": action.lower(),
                        "display": action
                    }
                ],
                action="E",  # Execute
                recorded=datetime.now(timezone.utc).isoformat(),
                outcome="0",  # Success
                agent=[
                    {
                        "who": {
                            "reference": f"Practitioner/{user.id}",
                            "display": user.name
                        },
                        "altId": user.email,
                        "name": user.name,
                        "requestor": True
                    }
                ],
                source={
                    "site": "TulsiHealth",
                    "observer": {
                        "reference": "Device/audit-logger",
                        "display": "Audit Logger"
                    },
                    "type": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/security-source-type",
                            "code": "4",
                            "display": "Application Server"
                        }
                    ]
                },
                entity=[
                    {
                        "what": {
                            "reference": f"{resource_type}/{resource_id}",
                            "type": resource_type
                        },
                        "type": {
                            "system": "http://hl7.org/fhir/resource-types",
                            "code": resource_type,
                            "display": resource_type
                        },
                        "lifecycle": {
                            "system": "http://hl7.org/fhir/object-lifecycle",
                            "code": "6",
                            "display": "Processing"
                        }
                    }
                ]
            )
            
            audit_event.validate()
            return audit_event
            
        except ValidationError as e:
            raise ValueError(f"FHIR AuditEvent validation error: {e}")
        except Exception as e:
            raise ValueError(f"Error generating AuditEvent: {e}")
    
    def _map_gender(self, gender: str) -> str:
        """Map gender to FHIR format"""
        gender_map = {
            "M": "male",
            "F": "female",
            "O": "other"
        }
        return gender_map.get(gender, "unknown")
    
    def _map_condition_status(self, status: str) -> Dict[str, str]:
        """Map condition status to FHIR format"""
        status_map = {
            "active": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
            "resolved": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "resolved"}]},
            "chronic": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]}
        }
        return status_map.get(status, {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]})
    
    def _map_encounter_status(self, status: str) -> str:
        """Map encounter status to FHIR format"""
        status_map = {
            "planned": "planned",
            "in-progress": "arrived",
            "completed": "finished",
            "cancelled": "cancelled"
        }
        return status_map.get(status, "unknown")
    
    def _map_severity(self, severity: str) -> Dict[str, str]:
        """Map severity to FHIR format"""
        severity_map = {
            "mild": {"coding": [{"system": "http://hl7.org/fhir/event-severity", "code": "mild"}]},
            "moderate": {"coding": [{"system": "http://hl7.org/fhir/event-severity", "code": "moderate"}]},
            "severe": {"coding": [{"system": "http://hl7.org/fhir/event-severity", "code": "severe"}]}
        }
        return severity_map.get(severity, {"coding": [{"system": "http://hl7.org/fhir/event-severity", "code": "moderate"}]})
    
    def _generate_practitioner_resource(self, user: User) -> Dict[str, Any]:
        """Generate FHIR Practitioner resource"""
        return {
            "resourceType": "Practitioner",
            "id": str(user.id),
            "name": [{
                "use": "official",
                "family": user.name.split()[-1] if len(user.name.split()) > 1 else "",
                "given": user.name.split()[:-1] if len(user.name.split()) > 1 else [user.name]
            }],
            "active": user.is_active
        }
    
    def validate_fhir_resource(self, resource: Dict[str, Any]) -> bool:
        """Validate FHIR resource structure"""
        try:
            # Basic validation checks
            if not isinstance(resource, dict):
                return False
            
            if "resourceType" not in resource:
                return False
            
            resource_type = resource["resourceType"]
            valid_types = [
                "Patient", "Condition", "Encounter", "Bundle", "CodeSystem",
                "ConceptMap", "ValueSet", "AuditEvent", "Provenance", "Practitioner"
            ]
            
            if resource_type not in valid_types:
                return False
            
            # Add more specific validation based on resource type
            return True
            
        except Exception:
            return False
    
    def serialize_fhir_resource(self, resource) -> Dict[str, Any]:
        """Serialize FHIR resource to dictionary"""
        try:
            if hasattr(resource, 'dict'):
                return resource.dict(exclude_none=True)
            else:
                return resource
        except Exception as e:
            raise ValueError(f"Error serializing FHIR resource: {e}")


# Global FHIR service instance
fhir_service = FHIRService()
