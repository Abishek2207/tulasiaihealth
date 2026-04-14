from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from api.database import get_db
from api.models.database import User, UserRole
from api.deps import get_current_active_user, require_role
from api.services.audit_service import audit_service
from api.services.ml_service import ml_service

router = APIRouter()

class SymptomExtractionRequest(BaseModel):
    text: str
    language: str = "en"

class SymptomExtractionResponse(BaseModel):
    extracted_codes: List[Dict[str, Any]]
    confidence_score: float

class RecoveryPredictionRequest(BaseModel):
    age: int
    chronic_conditions: List[str]
    severity: str
    current_medications: List[str] = []

class RecoveryPredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    confidence: float
    factors: Dict[str, Any]
    recommendations: List[str]

class MedicineRecommendationRequest(BaseModel):
    patient_profile: Dict[str, Any]
    conditions: List[str]

class MedicineRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    disclaimer: str

@router.post("/extract-symptoms", response_model=SymptomExtractionResponse)
async def extract_symptoms(
    request: SymptomExtractionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if len(request.text) < 10:
        raise HTTPException(status_code=400, detail="Text too short")
        
    extracted_codes = ml_service.extract_symptoms_from_text(request.text, request.language)
    confidence_score = sum(c["confidence"] for c in extracted_codes) / len(extracted_codes) if extracted_codes else 0.0
    
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="EXECUTE", resource_type="MLService",
        resource_id="symptom_extraction", operation="extract_symptoms", outcome="success", ip_address="127.0.0.1"
    )
    
    return {"extracted_codes": extracted_codes, "confidence_score": confidence_score}

@router.post("/predict-recovery", response_model=RecoveryPredictionResponse)
async def predict_recovery(
    request: RecoveryPredictionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if request.age < 0 or request.severity not in ["mild", "moderate", "severe"]:
        raise HTTPException(status_code=400, detail="Invalid inputs")
        
    data = request.model_dump()
    prediction = ml_service.predict_recovery_risk(data)
    
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="EXECUTE", resource_type="MLService",
        resource_id="predict_recovery", operation="predict_recovery", outcome="success", ip_address="127.0.0.1"
    )
    return prediction

@router.post("/recommend-medicines", response_model=MedicineRecommendationResponse)
async def recommend_medicines(
    request: MedicineRecommendationRequest,
    current_user: User = Depends(require_role(UserRole.DOCTOR)),
    db: AsyncSession = Depends(get_db)
):
    if not request.conditions:
        raise HTTPException(status_code=400, detail="At least one condition must be provided")
        
    recommendations = ml_service.recommend_ayush_medicines(request.patient_profile, request.conditions)
    
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="EXECUTE", resource_type="MLService",
        resource_id="recommend_medicines", operation="recommend_medicines", outcome="success", ip_address="127.0.0.1"
    )
    
    return {
        "recommendations": recommendations,
        "disclaimer": "These recommendations are for informational purposes only."
    }

@router.get("/model-status")
async def get_model_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="READ", resource_type="MLService",
        resource_id="model_status", operation="get_model_status", outcome="success", ip_address="127.0.0.1"
    )
    
    return {
        "models": {
            "nlp_symptom_extractor": {"exists": True, "status": "trained"},
            "recovery_predictor": {"exists": True, "status": "trained"},
            "medicine_recommender": {"exists": True, "status": "available"}
        }
    }
