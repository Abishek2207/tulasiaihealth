"""
RAG Schemas for TulsiHealth
Pydantic models for RAG requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime


class RAGDiagnoseRequest(BaseModel):
    """Request model for RAG diagnosis"""
    symptoms: str = Field(..., description="Patient symptoms description")
    language: str = Field("en", description="Language code (en/ta/hi)")
    patient_id: Optional[str] = Field(None, description="Patient ID (if available)")
    patient_context: Optional[Dict[str, Any]] = Field(None, description="Additional patient context")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ["en", "ta", "hi"]:
            raise ValueError('Language must be one of: en, ta, hi')
        return v


class SuggestedCode(BaseModel):
    """Suggested NAMASTE code model"""
    code: str = Field(..., description="NAMASTE code")
    system: str = Field(..., description="System (AYU/SID/UNA)")
    name: str = Field(..., description="Condition name")
    tm2_code: Optional[str] = Field(None, description="ICD-11 TM2 code")
    icd11_mms_code: Optional[str] = Field(None, description="ICD-11 MMS code")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")


class ICD11Map(BaseModel):
    """ICD-11 mapping model"""
    tm2_code: Optional[str] = Field(None, description="ICD-11 TM2 code")
    mms_code: Optional[str] = Field(None, description="ICD-11 MMS code")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Mapping confidence")


class RetrievedChunk(BaseModel):
    """Retrieved knowledge chunk model"""
    id: str
    text: str
    source: str
    category: str
    system: str
    chunk_id: int
    relevance_score: float = Field(..., ge=0.0, le=1.0)


class RAGResponse(BaseModel):
    """Response model for RAG diagnosis"""
    suggested_codes: List[SuggestedCode] = Field(default_factory=list)
    icd11_maps: List[ICD11Map] = Field(default_factory=list)
    safety_flags: List[str] = Field(default_factory=list)
    explanation: str = Field(..., description="AI-generated explanation")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    retrieved_chunks: List[RetrievedChunk] = Field(default_factory=list)
    
    class Config:
        schema_extra = {
            "example": {
                "suggested_codes": [
                    {
                        "code": "AYU-D-0001",
                        "system": "AYU",
                        "name": "Vataja Jwara",
                        "tm2_code": "TM2-SC04",
                        "icd11_mms_code": "5A10.0",
                        "confidence": 0.85
                    }
                ],
                "icd11_maps": [
                    {
                        "tm2_code": "TM2-SC04",
                        "mms_code": "5A10.0",
                        "confidence": 0.80
                    }
                ],
                "safety_flags": ["Consult physician for confirmation"],
                "explanation": "Based on the symptoms of dry cough, body pain, and variable temperature, this suggests a Vata-type fever...",
                "confidence_score": 0.82,
                "retrieved_chunks": []
            }
        }


class RAGMedicineRequest(BaseModel):
    """Request model for RAG medicine recommendation"""
    namaste_code: str = Field(..., description="NAMASTE code")
    patient_id: Optional[str] = Field(None, description="Patient ID")
    age: int = Field(..., ge=0, le=150, description="Patient age")
    gender: str = Field(..., description="Patient gender (M/F/O)")
    pregnancy: bool = Field(False, description="Patient is pregnant")
    cardiac_history: bool = Field(False, description="Patient has cardiac history")
    current_meds: List[str] = Field(default_factory=list, description="Current medications")
    
    @validator('gender')
    def validate_gender(cls, v):
        if v not in ["M", "F", "O"]:
            raise ValueError('Gender must be one of: M, F, O')
        return v


class MedicineRecommendation(BaseModel):
    """Medicine recommendation model"""
    name: str = Field(..., description="Medicine name")
    form: str = Field(..., description="Medicine form (powder/tablet/etc)")
    dosage: str = Field(..., description="Dosage instructions")


class MedicineResponse(BaseModel):
    """Response model for medicine recommendation"""
    medicines: List[MedicineRecommendation] = Field(default_factory=list)
    dosage: str = Field(..., description="General dosage guidelines")
    contraindications: List[str] = Field(default_factory=list)
    clinician_note: str = Field(..., description="Clinician confirmation note")
    
    class Config:
        schema_extra = {
            "example": {
                "medicines": [
                    {
                        "name": "Ashwagandha",
                        "form": "Powder",
                        "dosage": "1-2g twice daily with warm water"
                    }
                ],
                "dosage": "Take medicines after meals with warm water",
                "contraindications": ["Pregnancy", "Severe cardiac conditions"],
                "clinician_note": "Clinician confirmation required before administration."
            }
        }


class NAMASTECodeExplanation(BaseModel):
    """NAMASTE code explanation model"""
    code: str
    system: str
    name_en: str
    name_ta: Optional[str] = None
    name_hi: Optional[str] = None
    description: str
    category: Optional[str] = None
    dosha: Optional[str] = None
    tm2_code: Optional[str] = None
    icd11_mms_code: Optional[str] = None
    explanation: str
    details: Dict[str, str] = Field(default_factory=dict)
    related_codes: List[str] = Field(default_factory=list)


class SymptomExtractionRequest(BaseModel):
    """Request model for symptom extraction"""
    text: str = Field(..., description="Text to extract symptoms from")
    language: str = Field("en", description="Language code (en/ta/hi)")
    
    @validator('language')
    def validate_language(cls, v):
        if v not in ["en", "ta", "hi"]:
            raise ValueError('Language must be one of: en, ta, hi')
        return v


class SymptomExtractionResponse(BaseModel):
    """Response model for symptom extraction"""
    symptoms: List[str] = Field(default_factory=list)
    language: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class RAGSession(BaseModel):
    """RAG session model"""
    id: str
    query: str
    language: str
    response: Dict[str, Any]
    model_used: str
    confidence_score: float
    created_at: str


class RAGSessionHistory(BaseModel):
    """RAG session history response"""
    sessions: List[RAGSession] = Field(default_factory=list)
    total_count: int
    patient_id: str


class RAGStatistics(BaseModel):
    """RAG usage statistics model"""
    total_sessions: int = 0
    language_distribution: Dict[str, int] = Field(default_factory=dict)
    average_confidence_score: float = 0.0
    model_usage: Dict[str, int] = Field(default_factory=dict)
    most_common_queries: List[str] = Field(default_factory=list)
    success_rate: float = 0.0


class RAGHealthResponse(BaseModel):
    """RAG service health response"""
    status: str
    services: Dict[str, str]
    statistics: Dict[str, Any]
    timestamp: str


class RAGRetrievalTest(BaseModel):
    """RAG retrieval test request"""
    query: str = Field(..., description="Test query")
    language: str = Field("en", description="Language code")
    n_results: int = Field(5, ge=1, le=20, description="Number of results to return")


class RAGRetrievalTestResponse(BaseModel):
    """RAG retrieval test response"""
    query: str
    language: str
    retrieved_chunks: List[RetrievedChunk]
    total_retrieved: int
    processing_time_ms: Optional[float] = None


class RAGIndexRebuildResponse(BaseModel):
    """RAG index rebuild response"""
    message: str
    status: str
    document_count: Optional[int] = None
    processing_time_seconds: Optional[float] = None


class NLPExtractionResponse(BaseModel):
    """NLP extraction response"""
    extracted_entities: List[Dict[str, Any]] = Field(default_factory=list)
    symptoms: List[str] = Field(default_factory=list)
    conditions: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    confidence_score: float = 0.0


class BatchDiagnosisRequest(BaseModel):
    """Batch diagnosis request"""
    requests: List[RAGDiagnoseRequest] = Field(..., min_items=1, max_items=10)
    
    @validator('requests')
    def validate_requests(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 requests allowed per batch')
        return v


class BatchDiagnosisResponse(BaseModel):
    """Batch diagnosis response"""
    results: List[RAGResponse] = Field(default_factory=list)
    total_processed: int
    success_count: int
    error_count: int
    processing_time_ms: Optional[float] = None


class QualityMetrics(BaseModel):
    """RAG quality metrics"""
    retrieval_precision: float = 0.0
    retrieval_recall: float = 0.0
    generation_coherence: float = 0.0
    factual_accuracy: float = 0.0
    user_satisfaction: float = 0.0


class FeedbackRequest(BaseModel):
    """RAG feedback request"""
    session_id: str = Field(..., description="RAG session ID")
    rating: int = Field(..., ge=1, le=5, description="User rating (1-5)")
    feedback_text: Optional[str] = Field(None, description="User feedback")
    helpful: bool = Field(..., description="Was the response helpful?")
    accurate: bool = Field(..., description="Was the response accurate?")


class FeedbackResponse(BaseModel):
    """Feedback submission response"""
    message: str
    feedback_id: str
    submitted_at: str
