import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
import pickle
import os
from datetime import datetime

from services.terminology_service import terminology_service
from core.config import settings


class MLService:
    def __init__(self):
        self.models_dir = settings.ML_MODEL_PATH
        self.nlp_model = None
        self.recovery_model = None
        self.medicine_recommender = None
        
        # Create models directory if it doesn't exist
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize ML models"""
        
        # NLP model for symptom extraction
        self.nlp_model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        
        # Recovery prediction model
        self.recovery_model = RandomForestClassifier(n_estimators=100, random_state=42)
        
        # Load pre-trained models if available
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        try:
            nlp_model_path = os.path.join(self.models_dir, "nlp_model.pkl")
            if os.path.exists(nlp_model_path):
                with open(nlp_model_path, 'rb') as f:
                    self.nlp_model = pickle.load(f)
            
            recovery_model_path = os.path.join(self.models_dir, "recovery_model.pkl")
            if os.path.exists(recovery_model_path):
                with open(recovery_model_path, 'rb') as f:
                    self.recovery_model = pickle.load(f)
                    
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def _save_models(self):
        """Save models to disk"""
        try:
            nlp_model_path = os.path.join(self.models_dir, "nlp_model.pkl")
            with open(nlp_model_path, 'wb') as f:
                pickle.dump(self.nlp_model, f)
            
            recovery_model_path = os.path.join(self.models_dir, "recovery_model.pkl")
            with open(recovery_model_path, 'wb') as f:
                pickle.dump(self.recovery_model, f)
                
        except Exception as e:
            print(f"Error saving models: {e}")
    
    def extract_symptoms_from_text(self, text: str, language: str = "en") -> List[Dict[str, Any]]:
        """Extract NAMASTE candidate codes from free-text symptoms"""
        
        # For demo, use keyword-based extraction
        # In production, this would use a fine-tuned BERT model
        
        symptom_keywords = {
            "en": {
                "fever": "NAMASTE-015",
                "headache": "NAMASTE-011", 
                "cough": "NAMASTE-013",
                "breathlessness": "NAMASTE-014",
                "diabetes": "NAMASTE-005",
                "heart pain": "NAMASTE-007",
                "joint pain": "NAMASTE-008",
                "stomach pain": "NAMASTE-010",
                "burning sensation": "NAMASTE-016"
            },
            "ta": {
                "Jwaram": "NAMASTE-015",
                "Thala Vali": "NAMASTE-011",
                "Yeqal": "NAMASTE-013", 
                "Swasam": "NAMASTE-014",
                "Madhumegham": "NAMASTE-005",
                "Hridaya Rogam": "NAMASTE-007",
                "Sandhivadam": "NAMASTE-008",
                "Vayiru Vembu": "NAMASTE-010"
            },
            "hi": {
                "Bukhar": "NAMASTE-015",
                "Sir Dard": "NAMASTE-011",
                "Khasi": "NAMASTE-013",
                "Shwas": "NAMASTE-014", 
                "Madhumeha": "NAMASTE-005",
                "Hriday Rog": "NAMASTE-007",
                "Sandhivat": "NAMASTE-008",
                "Pet Dard": "NAMASTE-010"
            }
        }
        
        text_lower = text.lower()
        extracted_codes = []
        
        keywords = symptom_keywords.get(language, symptom_keywords["en"])
        
        for keyword, code in keywords.items():
            if keyword.lower() in text_lower:
                extracted_codes.append({
                    "code": code,
                    "confidence": 0.8,  # Fixed confidence for demo
                    "matched_text": keyword
                })
        
        # Sort by confidence
        extracted_codes.sort(key=lambda x: x["confidence"], reverse=True)
        
        return extracted_codes
    
    def predict_recovery_risk(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict recovery risk based on patient data"""
        
        # For demo, use a simple rule-based approach
        # In production, this would use a trained ML model
        
        risk_factors = 0
        max_risk = 10
        
        # Age factor
        age = patient_data.get("age", 0)
        if age > 65:
            risk_factors += 3
        elif age > 50:
            risk_factors += 2
        elif age > 35:
            risk_factors += 1
        
        # Chronic conditions
        chronic_conditions = patient_data.get("chronic_conditions", [])
        risk_factors += len(chronic_conditions) * 2
        
        # Severity of current condition
        severity = patient_data.get("severity", "mild")
        if severity == "severe":
            risk_factors += 3
        elif severity == "moderate":
            risk_factors += 2
        elif severity == "mild":
            risk_factors += 1
        
        # Calculate risk score
        risk_score = min(risk_factors / max_risk, 1.0)
        risk_level = "low" if risk_score < 0.3 else "medium" if risk_score < 0.7 else "high"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": 0.75,
            "factors": {
                "age": age,
                "chronic_conditions": len(chronic_conditions),
                "severity": severity
            },
            "recommendations": self._get_recovery_recommendations(risk_level)
        }
    
    def _get_recovery_recommendations(self, risk_level: str) -> List[str]:
        """Get recovery recommendations based on risk level"""
        
        recommendations = {
            "low": [
                "Regular follow-up every 2 weeks",
                "Continue prescribed medications",
                "Monitor symptoms at home"
            ],
            "medium": [
                "Weekly follow-up appointments",
                "Strict medication adherence",
                "Daily health monitoring",
                "Consider nutritional support"
            ],
            "high": [
                "Daily monitoring required",
                "Hospital admission may be necessary",
                "Intensive medication regimen",
                "Specialist consultation recommended",
                "24/7 caregiver support"
            ]
        }
        
        return recommendations.get(risk_level, recommendations["low"])
    
    def recommend_ayush_medicines(self, patient_data: Dict[str, Any], conditions: List[str]) -> List[Dict[str, Any]]:
        """Recommend AYUSH medicines based on patient profile and conditions"""
        
        # AYUSH medicine database (simplified for demo)
        medicine_db = {
            "NAMASTE-001": [  # Vataja Jwara
                {"name": "Amritarishta", "form": "Liquid", "dose": "15ml twice daily", "contraindications": ["diabetes"]},
                {"name": "Tribhuvankirti Rasa", "form": "Tablet", "dose": "1 tablet twice daily", "contraindications": ["pregnancy", "children"]}
            ],
            "NAMASTE-002": [  # Pittaja Jwara
                {"name": "Sudarshana Ghanavati", "form": "Tablet", "dose": "2 tablets twice daily", "contraindications": ["hypotension"]},
                {"name": "Mahasudarshan Kadha", "form": "Decoction", "dose": "20ml twice daily", "contraindications": ["acidity"]}
            ],
            "NAMASTE-003": [  # Kaphaja Jwara
                {"name": "Sitopaladi Churna", "form": "Powder", "dose": "3g with honey twice daily", "contraindications": ["diabetes"]},
                {"name": "Talishadi Churna", "form": "Powder", "dose": "2g with warm water twice daily", "contraindications": []}
            ],
            "NAMASTE-005": [  # Madhumeha (Diabetes)
                {"name": "Nisha Amalaki", "form": "Tablet", "dose": "1 tablet twice daily", "contraindications": ["hypoglycemia"]},
                {"name": "Madhumehari Yog", "form": "Tablet", "dose": "2 tablets twice daily", "contraindications": ["pregnancy"]}
            ],
            "NAMASTE-008": [  # Sandhivata (Arthritis)
                {"name": "Rasnasaptak Kwath", "form": "Decoction", "dose": "30ml twice daily", "contraindications": ["acidity"]},
                {"name": "Maharasnadi Kadha", "form": "Decoction", "dose": "20ml twice daily", "contraindications": ["bleeding disorders"]}
            ]
        }
        
        recommendations = []
        
        # Check patient contraindications
        patient_profile = patient_data.get("profile", {})
        age = patient_profile.get("age", 0)
        is_pregnant = patient_profile.get("is_pregnant", False)
        has_cardiac_history = patient_profile.get("has_cardiac_history", False)
        current_medications = patient_profile.get("current_medications", [])
        
        for condition_code in conditions:
            if condition_code in medicine_db:
                for medicine in medicine_db[condition_code]:
                    # Check contraindications
                    contraindications = medicine["contraindications"]
                    
                    # Age-based contraindications
                    if age < 12 and "children" in contraindications:
                        continue
                    
                    # Pregnancy contraindications
                    if is_pregnant and "pregnancy" in contraindications:
                        continue
                    
                    # Cardiac history contraindications
                    if has_cardiac_history and "cardiac" in contraindications:
                        continue
                    
                    # Check for drug interactions
                    if any(med in current_medications for med in ["warfarin", "aspirin"]):
                        if "bleeding disorders" in contraindications:
                            continue
                    
                    # Add safety warnings
                    warnings = []
                    if age > 65:
                        warnings.append("Use with caution in elderly patients")
                    if "diabetes" in contraindications and "diabetes" in current_medications:
                        warnings.append("Monitor blood glucose levels closely")
                    
                    recommendations.append({
                        "name": medicine["name"],
                        "form": medicine["form"],
                        "dose": medicine["dose"],
                        "indications": condition_code,
                        "warnings": warnings,
                        "safety_level": "high" if not warnings else "medium" if len(warnings) <= 2 else "low"
                    })
        
        # Sort by safety level
        recommendations.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["safety_level"]])
        
        return recommendations
    
    def train_models(self, training_data: List[Dict[str, Any]]):
        """Train ML models with provided data"""
        
        # For demo, create simple training data
        # In production, this would use real patient data
        
        if len(training_data) < 10:
            print("Insufficient training data")
            return
        
        # Extract features and labels for NLP model
        texts = []
        labels = []
        
        for data in training_data:
            if "symptom_text" in data and "diagnosis_code" in data:
                texts.append(data["symptom_text"])
                labels.append(data["diagnosis_code"])
        
        if len(texts) > 0:
            # Train NLP model
            self.nlp_model.fit(texts, labels)
            
            # Train recovery model
            # Create synthetic features for recovery prediction
            features = []
            recovery_labels = []
            
            for data in training_data:
                feature_vector = [
                    data.get("age", 0),
                    len(data.get("chronic_conditions", [])),
                    1 if data.get("severity") == "severe" else 0,
                    1 if data.get("severity") == "moderate" else 0
                ]
                features.append(feature_vector)
                recovery_labels.append(1 if data.get("recovery_good", True) else 0)
            
            if len(features) > 0:
                self.recovery_model.fit(features, recovery_labels)
            
            # Save trained models
            self._save_models()
            
            print("Models trained successfully")


# Global ML service instance
ml_service = MLService()
