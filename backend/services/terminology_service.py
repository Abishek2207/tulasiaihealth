import asyncio
import csv
import json
import httpx
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from api.models.codesystem import CodeSystem, Concept, ConceptMap
from core.database import get_db
from core.config import settings


class TerminologyService:
    def __init__(self):
        self.icd11_base_url = settings.ICD11_API_URL
        self.icd11_entity_url = settings.ICD11_BASE_URL
        
    async def initialize(self):
        """Initialize terminology services by loading seed data"""
        print("Initializing terminology service...")
        
        # Load NAMASTE codes
        await self.load_namaste_codes()
        
        # Sync ICD-11 data
        await self.sync_icd11_data()
        
        print("Terminology service initialized successfully!")
    
    async def load_namaste_codes(self):
        """Load NAMASTE codes from CSV file"""
        db = next(get_db())
        
        try:
            # Check if NAMASTE CodeSystem already exists
            namaste_cs = db.query(CodeSystem).filter(
                CodeSystem.url == "http://tulsihealth.in/fhir/CodeSystem/namaste"
            ).first()
            
            if not namaste_cs:
                # Create NAMASTE CodeSystem
                namaste_cs = CodeSystem(
                    url="http://tulsihealth.in/fhir/CodeSystem/namaste",
                    name="NAMASTE",
                    title="NAMASTE AYUSH Terminology",
                    status="active",
                    version="1.0.0",
                    publisher="TulsiHealth",
                    description="National Ayurveda, Siddha, Unani, Siddha, and Homeopathy Terminology",
                    content="complete",
                    ayush_system="ayurveda"
                )
                db.add(namaste_cs)
                db.commit()
                db.refresh(namaste_cs)
            
            # Load concepts from CSV
            with open(settings.NAMASTE_CSV_PATH, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    # Check if concept already exists
                    existing_concept = db.query(Concept).filter(
                        Concept.codesystem_id == namaste_cs.id,
                        Concept.code == row['code']
                    ).first()
                    
                    if not existing_concept:
                        concept = Concept(
                            codesystem_id=namaste_cs.id,
                            code=row['code'],
                            display=row['display'],
                            definition=row['definition'],
                            sanskrit_name=row['sanskrit_name'],
                            tamil_name=row['tamil_name'],
                            hindi_name=row['hindi_name'],
                            english_name=row['english_name'],
                            category=row['category'],
                            parent_code=row['parent_code'] if row['parent_code'] else None,
                            level=int(row['level']),
                            designation={
                                "en": {"value": row['english_name']},
                                "ta": {"value": row['tamil_name']},
                                "hi": {"value": row['hindi_name']},
                                "sa": {"value": row['sanskrit_name']}
                            },
                            property={
                                "dosha_involved": row['dosha_involved'],
                                "severity": row['severity'],
                                "chronicity": row['chronicity']
                            }
                        )
                        db.add(concept)
                
                db.commit()
                print(f"Loaded NAMASTE codes successfully")
                
        except Exception as e:
            print(f"Error loading NAMASTE codes: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def sync_icd11_data(self):
        """Sync ICD-11 data from WHO API"""
        db = next(get_db())
        
        try:
            # Check if ICD-11 CodeSystem already exists
            icd11_cs = db.query(CodeSystem).filter(
                CodeSystem.url == "http://id.who.int/icd/release/11/mms"
            ).first()
            
            if not icd11_cs:
                # Create ICD-11 CodeSystem
                icd11_cs = CodeSystem(
                    url="http://id.who.int/icd/release/11/mms",
                    name="ICD-11-MMS",
                    title="ICD-11 Mortality and Morbidity Statistics",
                    status="active",
                    version="2024",
                    publisher="World Health Organization",
                    description="International Classification of Diseases 11th Revision - Mortality and Morbidity Statistics",
                    content="complete",
                    source_url=self.icd11_base_url,
                    last_synced=datetime.utcnow(),
                    sync_status="completed"
                )
                db.add(icd11_cs)
                db.commit()
                db.refresh(icd11_cs)
            
            # Sample ICD-11 codes (in production, this would sync from WHO API)
            sample_icd11_codes = [
                {
                    "code": "1A00",
                    "display": "Fever of unknown origin",
                    "definition": "A clinical syndrome defined as fever that lasts for more than 3 weeks with no obvious source despite appropriate investigation.",
                    "category": "symptom"
                },
                {
                    "code": "5A00",
                    "display": "Diabetes mellitus",
                    "definition": "A group of metabolic diseases characterized by hyperglycemia resulting from defects in insulin secretion, insulin action, or both.",
                    "category": "disease"
                },
                {
                    "code": "BA40",
                    "display": "Ischaemic heart diseases",
                    "definition": "A group of diseases of the heart caused by reduced blood supply to the heart muscle.",
                    "category": "disease"
                },
                {
                    "code": "FA20",
                    "display": "Osteoarthritis",
                    "definition": "A degenerative joint disease characterized by breakdown of the cartilage in joints and underlying bone changes.",
                    "category": "disease"
                },
                {
                    "code": "AB80",
                    "display": "Hemorrhoids",
                    "definition": "Swollen veins in the lowest part of your rectum and anus.",
                    "category": "disease"
                },
                {
                    "code": "DA20",
                    "display": "Irritable bowel syndrome",
                    "definition": "A common disorder that affects the large intestine, characterized by cramping, abdominal pain, bloating, gas, and diarrhea or constipation.",
                    "category": "disease"
                },
                {
                    "code": "9A00",
                    "display": "Headache",
                    "definition": "Pain in any region of the head.",
                    "category": "symptom"
                },
                {
                    "code": "9A10",
                    "display": "Migraine",
                    "definition": "A primary headache disorder characterized by recurrent moderate to severe headaches.",
                    "category": "disease"
                }
            ]
            
            for code_data in sample_icd11_codes:
                existing_concept = db.query(Concept).filter(
                    Concept.codesystem_id == icd11_cs.id,
                    Concept.code == code_data['code']
                ).first()
                
                if not existing_concept:
                    concept = Concept(
                        codesystem_id=icd11_cs.id,
                        code=code_data['code'],
                        display=code_data['display'],
                        definition=code_data['definition'],
                        category=code_data['category'],
                        designation={
                            "en": {"value": code_data['display']}
                        }
                    )
                    db.add(concept)
            
            db.commit()
            print(f"Loaded ICD-11 codes successfully")
            
        except Exception as e:
            print(f"Error syncing ICD-11 data: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def suggest_codes(self, query: str, lang: str = "en", limit: int = 10) -> List[Dict]:
        """Autocomplete search for codes across all terminology systems"""
        db = next(get_db())
        
        try:
            # Search in NAMASTE
            namaste_results = db.query(Concept).join(CodeSystem).filter(
                CodeSystem.name == "NAMASTE",
                Concept.status == "active"
            )
            
            if lang == "ta":
                namaste_results = namaste_results.filter(
                    Concept.tamil_name.ilike(f"%{query}%")
                )
            elif lang == "hi":
                namaste_results = namaste_results.filter(
                    Concept.hindi_name.ilike(f"%{query}%")
                )
            else:
                namaste_results = namaste_results.filter(
                    Concept.display.ilike(f"%{query}%") |
                    Concept.english_name.ilike(f"%{query}%") |
                    Concept.definition.ilike(f"%{query}%")
                )
            
            namaste_results = namaste_results.limit(limit // 2).all()
            
            # Search in ICD-11
            icd11_results = db.query(Concept).join(CodeSystem).filter(
                CodeSystem.name == "ICD-11-MMS",
                Concept.status == "active",
                Concept.display.ilike(f"%{query}%") |
                Concept.definition.ilike(f"%{query}%")
            ).limit(limit // 2).all()
            
            # Combine results
            suggestions = []
            
            for concept in namaste_results:
                suggestions.append({
                    "code": concept.code,
                    "display": concept.display,
                    "system": "NAMASTE",
                    "definition": concept.definition,
                    "category": concept.category,
                    "properties": concept.property or {}
                })
            
            for concept in icd11_results:
                suggestions.append({
                    "code": concept.code,
                    "display": concept.display,
                    "system": "ICD-11-MMS",
                    "definition": concept.definition,
                    "category": concept.category,
                    "properties": {}
                })
            
            return suggestions
            
        except Exception as e:
            print(f"Error in suggest_codes: {e}")
            return []
        finally:
            db.close()
    
    async def translate_concept(self, code: str, from_system: str, to_system: str) -> Dict:
        """Translate a concept from one system to another"""
        db = next(get_db())
        
        try:
            # Find source concept
            source_cs = db.query(CodeSystem).filter(CodeSystem.name == from_system).first()
            target_cs = db.query(CodeSystem).filter(CodeSystem.name == to_system).first()
            
            if not source_cs or not target_cs:
                return {"error": "Invalid terminology system"}
            
            source_concept = db.query(Concept).filter(
                Concept.codesystem_id == source_cs.id,
                Concept.code == code
            ).first()
            
            if not source_concept:
                return {"error": "Source concept not found"}
            
            # For now, return a simple mapping (in production, this would use concept maps)
            # This is a simplified version - real implementation would use ConceptMap relationships
            
            # Example mappings (in production, these would be in the database)
            example_mappings = {
                ("NAMASTE", "ICD-11-MMS"): {
                    "NAMASTE-001": "1A00",  # Vataja Jwara -> Fever
                    "NAMASTE-002": "1A00",  # Pittaja Jwara -> Fever
                    "NAMASTE-003": "1A00",  # Kaphaja Jwara -> Fever
                    "NAMASTE-005": "5A00",  # Madhumeha -> Diabetes
                    "NAMASTE-007": "BA40",  # Hridroga -> Ischaemic heart diseases
                    "NAMASTE-008": "FA20",  # Sandhivata -> Osteoarthritis
                    "NAMASTE-009": "AB80",  # Arshas -> Hemorrhoids
                    "NAMASTE-010": "DA20",  # Grahani -> Irritable bowel syndrome
                    "NAMASTE-011": "9A00",  # Shiroroga -> Headache
                }
            }
            
            mapping_key = (from_system, to_system)
            if mapping_key in example_mappings and code in example_mappings[mapping_key]:
                target_code = example_mappings[mapping_key][code]
                
                target_concept = db.query(Concept).filter(
                    Concept.codesystem_id == target_cs.id,
                    Concept.code == target_code
                ).first()
                
                if target_concept:
                    return {
                        "source_code": code,
                        "source_display": source_concept.display,
                        "target_code": target_code,
                        "target_display": target_concept.display,
                        "equivalence": "narrow",  # Default equivalence
                        "confidence": "medium"
                    }
            
            return {"error": "No mapping found"}
            
        except Exception as e:
            print(f"Error in translate_concept: {e}")
            return {"error": "Translation failed"}
        finally:
            db.close()
