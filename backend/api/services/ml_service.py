import logging
import random
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timezone

# We can reuse the embedding logic if needed, but for simple extraction 
# we'll use a keyword + semantic mapping approach
from api.models.database import NamasteCode, ICD11Code
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

class MLService:
    """Service for healthcare-specific ML tasks: symptom extraction, risk prediction, and recommendations"""
    
    def __init__(self):
        # In a real system, we'd load specialized models here
        # For this production-ready demo, we use heuristic-AI hybrid logic
        pass

    def extract_symptoms_from_text(self, text: str, language: str = "en") -> List[Dict[str, Any]]:
        """
        Extract medical symptoms and map to NAMASTE codes.
        In production, this would use a BioBERT or similar NER model.
        """
        # Mocking extraction logic for demonstration
        # Real implementation would use spacy-medcat or similar
        keywords_map = {
            "fever": {"code": "AYU-D-0001", "name": "Vataja Jwara", "confidence": 0.95},
            "jwara": {"code": "AYU-D-0001", "name": "Vataja Jwara", "confidence": 0.98},
            "cough": {"code": "AYU-D-0501", "name": "Kasa", "confidence": 0.92},
            "joint pain": {"code": "AYU-D-0301", "name": "Amavata", "confidence": 0.88},
            "diabetes": {"code": "AYU-D-0110", "name": "Madhumeha", "confidence": 0.96},
            "sugar": {"code": "AYU-D-0110", "name": "Madhumeha", "confidence": 0.85},
            "skin rash": {"code": "SID-D-0301", "name": "Kuttam", "confidence": 0.89},
        }
        
        extracted = []
        text_lower = text.lower()
        
        for k, v in keywords_map.items():
            if k in text_lower:
                extracted.append({
                    "code": v["code"],
                    "display": v["name"],
                    "confidence": v["confidence"],
                    "context": text[max(0, text_lower.find(k)-20):min(len(text), text_lower.find(k)+len(k)+20)]
                })
        
        # If no keywords found, return a default with lower confidence or empty
        return extracted

    def predict_recovery_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict recovery risk and timeline.
        Uses a weighted scoring model based on age, severity, and chronic conditions.
        """
        age = data.get("age", 30)
        severity = data.get("severity", "moderate")
        chronic_count = len(data.get("chronic_conditions", []))
        
        # Base risk score (0-1)
        score = 0.2
        
        # Age factor
        if age > 60: score += 0.3
        elif age > 45: score += 0.15
        
        # Severity factor
        if severity == "severe": score += 0.4
        elif severity == "moderate": score += 0.2
        
        # Chronic conditions factor
        score += min(0.3, chronic_count * 0.1)
        
        # Clamp score
        score = min(0.95, score)
        
        risk_level = "low"
        if score > 0.7: risk_level = "high"
        elif score > 0.4: risk_level = "moderate"
        
        return {
            "risk_score": round(score, 2),
            "risk_level": risk_level,
            "confidence": 0.85,
            "estimated_recovery_days": int(score * 30) + 5,
            "factors": {
                "age_weight": 0.3,
                "severity_weight": 0.4,
                "comorbidity_weight": 0.3
            },
            "recommendations": [
                "Increase fluid intake",
                "Monitor oxygen levels daily" if score > 0.5 else "Regular vital checks",
                "Follow-up in 3 days"
            ]
        }

    def recommend_ayush_medicines(self, patient_profile: Dict[str, Any], conditions: List[str]) -> List[Dict[str, Any]]:
        """
        Recommend medicines based on conditions and AYUSH principles.
        """
        # Comprehensive mapping for AYUSH medicines
        medicine_db = {
            "AYU-D-0001": [
                {"name": "Sudarshan Vati", "dosage": "1-2 tablets twice daily", "system": "Ayurveda"},
                {"name": "Amritarishta", "dosage": "15-20 ml twice daily", "system": "Ayurveda"}
            ],
            "AYU-D-0110": [
                {"name": "Chandraprabha Vati", "dosage": "1 tablet twice daily", "system": "Ayurveda"},
                {"name": "Nisha Amalaki", "dosage": "3g twice daily with water", "system": "Ayurveda"}
            ],
            "AYU-D-0301": [
                {"name": "Simhanada Guggulu", "dosage": "2 tablets twice daily", "system": "Ayurveda"},
                {"name": "Dashamoolarishta", "dosage": "20ml with water", "system": "Ayurveda"}
            ]
        }
        
        recommendations = []
        for cond in conditions:
            if cond in medicine_db:
                recommendations.extend(medicine_db[cond])
        
        # If no specific match, provide general wellness
        if not recommendations:
            recommendations.append({
                "name": "General Wellness Tonic",
                "dosage": "As per practitioner advice",
                "system": "AYUSH-Integrated"
            })
            
        return recommendations

# Global instance
ml_service = MLService()
