"""
TulsiHealth ML Routes — Production
NLP triage, recovery prediction, medicine recommendation, terminology fallback
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from api.services.ml_service import ml_service, audit_chain

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────

class SymptomTriageRequest(BaseModel):
    symptoms: List[str]
    age: Optional[str] = "30"
    gender: Optional[str] = "M"

class TriageResponse(BaseModel):
    risk_level: str
    risk_score: float
    matches: List[Dict[str, Any]]
    recommendations: List[str]
    timestamp: str

class SymptomExtractionRequest(BaseModel):
    text: str
    language: str = "en"

class RecoveryPredictionRequest(BaseModel):
    age: int
    chronic_conditions: List[str] = []
    severity: str = "mild"
    current_medications: List[str] = []
    is_pregnant: bool = False
    has_heart_surgery: bool = False
    has_diabetes: bool = False

class MedicineRecommendationRequest(BaseModel):
    patient_profile: Dict[str, Any]
    conditions: List[str]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/triage")
async def run_triage(
    symptoms: List[str],
    age: str = Query("30"),
    gender: str = Query("M"),
):
    """
    AI triage: map symptoms list to NAMASTE codes with risk scoring.
    Used by the AI Triage dashboard page.
    """
    if not symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom required")

    text_input = " ".join(symptoms)
    matches = ml_service.extract_symptoms_from_text(text_input)

    # Risk scoring based on matched conditions + age
    age_int = int(age) if age.isdigit() else 30
    base_risk = 0.0
    if matches:
        base_risk = matches[0].get("confidence", 0.3)

    if age_int > 65:
        base_risk = min(base_risk + 0.15, 1.0)
    elif age_int < 18:
        base_risk = min(base_risk + 0.05, 1.0)

    risk_level = (
        "high" if base_risk >= 0.70
        else "moderate" if base_risk >= 0.40
        else "low"
    )

    recommendations = [
        f"Primary assessment: {matches[0]['namaste_name']}" if matches else "General evaluation recommended",
        "Monitor vitals every 4 hours",
        "Avoid self-medication without physician guidance",
    ]
    if risk_level == "high":
        recommendations.insert(0, "⚠️ Immediate clinical attention required")

    # Log to blockchain audit chain
    audit_chain.add_audit_event(
        action="ML_TRIAGE",
        resource="TriageEngine",
        resource_id=f"triage_{len(symptoms)}_symptoms",
        user_id="system",
        outcome="success",
        details={"symptoms": symptoms, "risk_level": risk_level},
    )

    from datetime import datetime
    return {
        "risk_level": risk_level,
        "risk_score": round(base_risk, 3),
        "matches": matches,
        "recommendations": recommendations,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/extract-symptoms")
async def extract_symptoms(request: SymptomExtractionRequest):
    """NLP text → NAMASTE code extraction."""
    if len(request.text) < 5:
        raise HTTPException(status_code=400, detail="Text too short for extraction")

    codes = ml_service.extract_symptoms_from_text(request.text, request.language)
    confidence = sum(c["confidence"] for c in codes) / len(codes) if codes else 0.0

    return {
        "extracted_codes": codes,
        "confidence_score": round(confidence, 3),
        "language": request.language,
    }


@router.post("/predict-recovery")
async def predict_recovery(request: RecoveryPredictionRequest):
    """ML recovery risk prediction with special flag handling."""
    if request.age < 0 or request.age > 120:
        raise HTTPException(status_code=400, detail="Invalid age")
    if request.severity not in ["mild", "moderate", "severe"]:
        raise HTTPException(status_code=400, detail="severity must be mild | moderate | severe")

    result = ml_service.predict_recovery_risk(request.model_dump())
    return result


@router.post("/recommend-medicines")
async def recommend_medicines(request: MedicineRecommendationRequest):
    """AYUSH medicine recommendation — assistive only, never automatic prescription."""
    if not request.conditions:
        raise HTTPException(status_code=400, detail="At least one condition required")

    recs = ml_service.recommend_ayush_medicines(request.patient_profile, request.conditions)
    return {
        "recommendations": recs,
        "disclaimer": (
            "These AYUSH medicine suggestions are assistive only and do not constitute a prescription. "
            "All treatment decisions must be made by a qualified physician."
        ),
    }


@router.post("/medicine-recommend")
async def medicine_recommend_by_code(
    namaste_code: str = Query(..., description="NAMASTE code e.g. AYU-D-0001"),
):
    """Quick medicine lookup by NAMASTE code."""
    from api.services.ml_service import NAMASTE_KNOWLEDGE_BASE
    for entry in NAMASTE_KNOWLEDGE_BASE:
        if entry["namaste_code"].upper() == namaste_code.upper():
            return {
                "namaste_code": entry["namaste_code"],
                "name": entry["name"],
                "icd11": entry["icd11"],
                "medicines": entry["medicines"],
                "disclaimer": "Assistive guidance only. Consult physician before use.",
            }
    raise HTTPException(status_code=404, detail=f"NAMASTE code {namaste_code} not found")


@router.get("/model-status")
async def model_status():
    """Return the status of all AI/ML models."""
    chain = audit_chain.get_chain()
    return {
        "models": {
            "nlp_symptom_extractor": {
                "status": "operational",
                "type": "keyword-nlp",
                "languages": ["en", "ta"],
                "namaste_codes": 8,
            },
            "recovery_predictor": {
                "status": "operational",
                "type": "rule-based-ml",
                "features": ["age", "severity", "conditions", "pregnancy", "cardiac_history"],
            },
            "medicine_recommender": {
                "status": "operational",
                "type": "knowledge-base",
                "entries": 8,
                "contraindication_filtering": True,
            },
            "terminology_search": {
                "status": "operational",
                "namaste_codes": 15,
                "concept_mappings": 15,
                "languages": ["en", "ta"],
            },
        },
        "blockchain_audit": {
            "status": "operational",
            "chain_length": len(chain),
            "integrity": audit_chain.verify_integrity(),
            "last_block_hash": chain[-1]["hash"][:16] + "..." if chain else None,
        },
    }


@router.get("/blockchain-audit")
async def get_blockchain_audit(limit: int = Query(10, le=100)):
    """Return the last N blocks in the audit chain."""
    chain = audit_chain.get_chain()
    return {
        "chain_length": len(chain),
        "integrity_valid": audit_chain.verify_integrity(),
        "blocks": chain[-limit:],
    }
