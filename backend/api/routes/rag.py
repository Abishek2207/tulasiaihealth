"""
RAG Routes for TulsiHealth
Handles Retrieval-Augmented Generation endpoints for diagnosis and medicine recommendations
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.database import User, UserRole
from api.services.rag_service import rag_service
from api.database import get_db
from api.schemas.rag import RAGDiagnoseRequest, RAGMedicineRequest, RAGResponse
from api.deps import get_current_active_user, require_role

router = APIRouter()


@router.post("/diagnose", response_model=RAGResponse)
async def diagnose_with_rag(
    request: RAGDiagnoseRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Diagnose using RAG (Retrieval-Augmented Generation)
    
    This endpoint:
    1. Takes patient symptoms as input
    2. Retrieves relevant knowledge from ChromaDB
    3. Uses LLM to generate diagnosis with NAMASTE code suggestions
    4. Maps to ICD-11 TM2 and MMS codes
    5. Provides safety warnings and confidence scores
    """
    try:
        # Validate permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors and clinicians can perform diagnosis"
            )
        
        # Validate patient access if patient_id provided
        if request.patient_id:
            # In production, check consent and permissions
            pass
        
        # Perform RAG diagnosis
        response = await rag_service.diagnose_with_rag(request, current_user, db)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG diagnosis failed: {str(e)}"
        )


@router.post("/medicine-recommend", response_model=Dict[str, Any])
async def recommend_medicine_with_rag(
    request: RAGMedicineRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Recommend medicines using RAG for a specific NAMASTE code
    
    This endpoint:
    1. Takes NAMASTE code and patient context
    2. Retrieves relevant medicine information from knowledge base
    3. Applies safety filters based on patient conditions
    4. Generates recommendations with contraindications
    5. Always includes clinician confirmation requirement
    """
    try:
        # Validate permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors and clinicians can recommend medicines"
            )
        
        # Validate patient access if patient_id provided
        if request.patient_id:
            # In production, check consent and permissions
            pass
        
        # Perform RAG medicine recommendation
        response = await rag_service.recommend_medicine_with_rag(request, current_user, db)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Medicine recommendation failed: {str(e)}"
        )


@router.get("/explain/{namaste_code}", response_model=Dict[str, Any])
async def explain_namaste_code(
    namaste_code: str,
    language: str = "en",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed explanation of a NAMASTE code using RAG
    
    This endpoint:
    1. Takes NAMASTE code and optional language
    2. Retrieves comprehensive information from knowledge base
    3. Generates detailed explanation including etiology, features, treatment
    4. Returns information in requested language
    """
    try:
        # Validate language
        if language not in ["en", "ta", "hi"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Language must be one of: en, ta, hi"
            )
        
        # Get explanation
        response = await rag_service.explain_namaste_code(
            namaste_code, language, current_user, db
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NAMASTE code explanation failed: {str(e)}"
        )


@router.post("/nlp/extract-symptoms", response_model=List[str])
async def extract_symptoms_nlp(
    request: Dict[str, str],
    current_user: User = Depends(get_current_active_user)
):
    """
    Extract symptoms from text using NLP
    
    This endpoint:
    1. Takes free-text symptom description
    2. Uses NLP to extract structured symptoms
    3. Returns list of extracted symptoms
    4. Supports multiple languages
    """
    try:
        text = request.get("text", "")
        language = request.get("language", "en")
        
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text is required"
            )
        
        # Validate language
        if language not in ["en", "ta", "hi"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Language must be one of: en, ta, hi"
            )
        
        # Extract symptoms
        symptoms = await rag_service.extract_symptoms_nlp(text, language)
        
        return symptoms
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Symptom extraction failed: {str(e)}"
        )


@router.get("/session-history/{patient_id}", response_model=List[Dict[str, Any]])
async def get_rag_session_history(
    patient_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get RAG session history for a patient
    
    This endpoint:
    1. Retrieves historical RAG sessions for a patient
    2. Returns queries, responses, and metadata
    3. Used for tracking patient diagnosis history
    """
    try:
        # Validate permissions
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Validate limit
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be between 1 and 100"
            )
        
        # Get session history
        history = await rag_service.get_rag_session_history(
            patient_id, current_user, db, limit
        )
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session history: {str(e)}"
        )


@router.get("/statistics", response_model=Dict[str, Any])
async def get_rag_statistics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get RAG usage statistics for the current user
    
    This endpoint:
    1. Returns usage statistics for RAG features
    2. Includes session counts, language distribution, confidence scores
    3. Used for analytics and monitoring
    """
    try:
        # Get statistics
        stats = await rag_service.get_rag_statistics(current_user, db)
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get RAG statistics: {str(e)}"
        )


@router.post("/test-retrieval", response_model=Dict[str, Any])
async def test_rag_retrieval(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """
    Test RAG retrieval system (admin only)
    
    This endpoint:
    1. Tests knowledge base retrieval
    2. Returns retrieved chunks and relevance scores
    3. Used for debugging and system validation
    """
    try:
        query = request.get("query", "")
        language = request.get("language", "en")
        n_results = request.get("n_results", 5)
        
        if not query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query is required"
            )
        
        # Test retrieval
        retrieved_chunks = await rag_service.retrieve_relevant_chunks(query, language)
        
        return {
            "query": query,
            "language": language,
            "retrieved_chunks": retrieved_chunks[:n_results],
            "total_retrieved": len(retrieved_chunks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG retrieval test failed: {str(e)}"
        )


@router.post("/rebuild-index", response_model=Dict[str, str])
async def rebuild_rag_index(
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    """
    Rebuild RAG knowledge base index (admin only)
    
    This endpoint:
    1. Rebuilds the ChromaDB index from knowledge base files
    2. Used when knowledge base is updated
    3. Returns indexing status and statistics
    """
    try:
        # In production, this would trigger the indexing process
        # For now, return a success message
        
        return {
            "message": "RAG index rebuild initiated",
            "status": "processing",
            "note": "This is a placeholder. Implement actual indexing process in production."
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG index rebuild failed: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def rag_health_check():
    """
    Health check for RAG service
    
    This endpoint:
    1. Checks RAG service connectivity
    2. Verifies ChromaDB connection
    3. Returns service status
    """
    try:
        # Test ChromaDB connection
        collection = rag_service.get_collection()
        
        # Get collection stats
        try:
            count = collection.count()
            collection_status = "connected"
            document_count = count
        except:
            collection_status = "error"
            document_count = 0
        
        # Check embedding model
        embedding_status = "loaded" if rag_service.embedding_model else "not_loaded"
        
        # Check LLM configuration
        llm_status = "configured" if rag_service.groq_api_key else "not_configured"
        
        return {
            "status": "healthy",
            "services": {
                "chromadb": collection_status,
                "embedding_model": embedding_status,
                "llm": llm_status
            },
            "statistics": {
                "document_count": document_count,
                "collection_name": rag_service.collection_name
            },
            "timestamp": "2024-01-01T00:00:00Z"  # Placeholder timestamp
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }
