from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Optional
from pydantic import BaseModel

from services.terminology_service import TerminologyService
from core.database import get_db


router = APIRouter()
terminology_service = TerminologyService()


class CodeSuggestion(BaseModel):
    code: str
    display: str
    system: str
    definition: str
    category: str
    properties: Dict


class TranslationRequest(BaseModel):
    code: str
    from_system: str
    to_system: str


class TranslationResponse(BaseModel):
    source_code: str
    source_display: str
    target_code: str
    target_display: str
    equivalence: str
    confidence: str


@router.get("/suggest", response_model=List[CodeSuggestion])
async def suggest_codes(
    q: str = Query(..., description="Search query"),
    lang: str = Query("en", description="Language: en, ta, hi"),
    limit: int = Query(10, description="Maximum number of results"),
    db = Depends(get_db)
):
    """
    Autocomplete search for codes across NAMASTE and ICD-11 terminology systems.
    
    Supports multilingual search in English, Tamil, and Hindi.
    """
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    suggestions = await terminology_service.suggest_codes(q, lang, limit)
    
    return [CodeSuggestion(**suggestion) for suggestion in suggestions]


@router.post("/translate", response_model=TranslationResponse)
async def translate_concept(
    request: TranslationRequest,
    db = Depends(get_db)
):
    """
    Translate a concept from one terminology system to another.
    
    Currently supports:
    - NAMASTE to ICD-11-MMS
    - ICD-11-MMS to NAMASTE (planned)
    """
    result = await terminology_service.translate_concept(
        request.code, request.from_system, request.to_system
    )
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return TranslationResponse(**result)


@router.get("/icd11/{linearization}/{code}")
async def get_icd11_entity(
    linearization: str,
    code: str,
    db = Depends(get_db)
):
    """
    Proxy WHO ICD-API with caching.
    
    Returns ICD-11 entity information with local caching.
    """
    # For now, return from local database
    # In production, this would proxy to WHO API and cache results
    
    from api.models.codesystem import CodeSystem, Concept
    
    # Find ICD-11 concept
    icd11_cs = db.query(CodeSystem).filter(CodeSystem.name == "ICD-11-MMS").first()
    if not icd11_cs:
        raise HTTPException(status_code=404, detail="ICD-11 CodeSystem not found")
    
    concept = db.query(Concept).filter(
        Concept.codesystem_id == icd11_cs.id,
        Concept.code == code
    ).first()
    
    if not concept:
        raise HTTPException(status_code=404, detail="ICD-11 code not found")
    
    return {
        "code": concept.code,
        "display": concept.display,
        "definition": concept.definition,
        "linearization": linearization,
        "category": concept.category
    }


@router.get("/valueset/expand")
async def expand_valueset(
    url: str = Query(..., description="ValueSet URL"),
    db = Depends(get_db)
):
    """
    FHIR ValueSet expansion for UI pickers.
    
    Expands a ValueSet to return all included concepts.
    """
    # For now, return a simple expansion based on the URL
    # In production, this would handle complex ValueSet definitions
    
    if "namaste" in url.lower():
        # Return all NAMASTE codes
        from api.models.codesystem import CodeSystem, Concept
        
        namaste_cs = db.query(CodeSystem).filter(CodeSystem.name == "NAMASTE").first()
        concepts = db.query(Concept).filter(
            Concept.codesystem_id == namaste_cs.id,
            Concept.status == "active"
        ).all()
        
        expansion = []
        for concept in concepts:
            expansion.append({
                "code": concept.code,
                "display": concept.display,
                "system": namaste_cs.url,
                "designation": concept.designation or {}
            })
        
        return {
            "resourceType": "ValueSet",
            "expansion": {
                "identifier": f"urn:uuid:{url}",
                "timestamp": "2024-01-01T00:00:00Z",
                "contains": expansion
            }
        }
    
    else:
        raise HTTPException(status_code=404, detail="ValueSet not found")


@router.get("/conceptmap/translate")
async def translate_via_conceptmap(
    code: str = Query(..., description="Code to translate"),
    fromSystem: str = Query(..., description="Source system URL"),
    toSystem: str = Query(..., description="Target system URL"),
    db = Depends(get_db)
):
    """
    FHIR ConceptMap translate operation.
    
    Translates a code using FHIR ConceptMap resources.
    """
    # Extract system names from URLs
    system_name_map = {
        "http://tulsihealth.in/fhir/CodeSystem/namaste": "NAMASTE",
        "http://id.who.int/icd/release/11/mms": "ICD-11-MMS"
    }
    
    from_system_name = system_name_map.get(fromSystem)
    to_system_name = system_name_map.get(toSystem)
    
    if not from_system_name or not to_system_name:
        raise HTTPException(status_code=400, detail="Unsupported terminology system")
    
    result = await terminology_service.translate_concept(code, from_system_name, to_system_name)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return {
        "resourceType": "Parameters",
        "parameter": [
            {"name": "result", "valueBoolean": True},
            {"name": "equivalence", "valueString": result["equivalence"]},
            {"name": "product", "part": [
                {"name": "code", "valueCode": result["target_code"]},
                {"name": "system", "valueUri": toSystem},
                {"name": "display", "valueString": result["target_display"]}
            ]}
        ]
    }
