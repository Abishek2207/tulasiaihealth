"""
RAG Service for TulsiHealth
Handles Retrieval-Augmented Generation for diagnosis and medicine recommendations
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
import json
import hashlib
from datetime import datetime, timezone

import chromadb
from sentence_transformers import SentenceTransformer
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.models.database import RAGSession, Patient, User, NamasteCode
from api.core.config import get_settings
from api.schemas.rag import RAGDiagnoseRequest, RAGMedicineRequest, RAGResponse

settings = get_settings()
logger = logging.getLogger(__name__)


class RAGService:
    """Handles RAG operations for diagnosis and medicine recommendations"""
    
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="rag/chroma_db")
        self.embedding_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        self.collection_name = settings.chroma_collection
        self.groq_api_key = settings.groq_api_key
        self.max_retrieved_chunks = 5
        self.temperature = 0.7
        self.max_tokens = 1000
        
    def get_collection(self):
        """Get ChromaDB collection"""
        try:
            collection = self.chroma_client.get_collection(name=self.collection_name)
            return collection
        except Exception as e:
            logger.error(f"Error getting collection: {e}")
            raise
    
    async def translate_text(self, text: str, target_lang: str = "en") -> str:
        """Translate text to target language using Helsinki-NLP"""
        if target_lang == "en":
            return text
        
        try:
            # For demo, return original text
            # In production, integrate with Helsinki-NLP or similar service
            logger.info(f"Translation from {target_lang} to en not implemented, returning original")
            return text
        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text
    
    async def retrieve_relevant_chunks(self, query: str, language: str = "en") -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from knowledge base"""
        try:
            # Translate query to English if needed
            if language != "en":
                query = await self.translate_text(query, "en")
            
            # Create query embedding
            query_embedding = self.embedding_model.encode([query])
            
            # Search collection
            collection = self.get_collection()
            results = collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=self.max_retrieved_chunks
            )
            
            # Format results
            retrieved_chunks = []
            for i, (doc_id, document, metadata) in enumerate(zip(
                results['ids'][0], 
                results['documents'][0], 
                results['metadatas'][0]
            )):
                chunk = {
                    "id": doc_id,
                    "text": document,
                    "source": metadata.get('source', 'Unknown'),
                    "category": metadata.get('category', 'Unknown'),
                    "system": metadata.get('system', 'Unknown'),
                    "chunk_id": metadata.get('chunk_id', i),
                    "relevance_score": 1.0 - (i * 0.1)  # Simple scoring
                }
                retrieved_chunks.append(chunk)
            
            return retrieved_chunks
            
        except Exception as e:
            logger.error(f"Chunk retrieval error: {e}")
            return []
    
    async def call_llm(self, prompt: str, max_tokens: int = None) -> str:
        """Call LLM for generation"""
        if not self.groq_api_key:
            # Fallback response for demo
            return "AI service not configured. Please configure GROQ API key."
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a helpful AI assistant for TulsiHealth, specializing in AYUSH medicine and dual coding systems."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "max_tokens": max_tokens or self.max_tokens,
                        "temperature": self.temperature
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
                else:
                    logger.error(f"LLM API error: {response.status_code} - {response.text}")
                    return "AI service temporarily unavailable."
                    
        except Exception as e:
            logger.error(f"LLM call error: {e}")
            return "AI service temporarily unavailable."
    
    async def diagnose_with_rag(self, request: RAGDiagnoseRequest, user: User, db: AsyncSession) -> RAGResponse:
        """Diagnose using RAG"""
        try:
            # Translate symptoms if needed
            symptoms = await self.translate_text(request.symptoms, "en")
            
            # Retrieve relevant chunks
            retrieved_chunks = await self.retrieve_relevant_chunks(symptoms, request.language)
            
            if not retrieved_chunks:
                return RAGResponse(
                    suggested_codes=[],
                    icd11_maps=[],
                    safety_flags=["No relevant information found in knowledge base"],
                    explanation="Unable to provide diagnosis due to insufficient information in knowledge base.",
                    confidence_score=0.0,
                    retrieved_chunks=[]
                )
            
            # Build context for LLM
            context = "\n\n".join([
                f"Source: {chunk['source']}\n{chunk['text']}" 
                for chunk in retrieved_chunks
            ])
            
            # Create prompt
            prompt = f"""
Based on the following AYUSH medical knowledge, analyze the symptoms and suggest appropriate NAMASTE codes with ICD-11 mappings.

Symptoms: {symptoms}

Knowledge Base Context:
{context}

Please provide:
1. Suggested NAMASTE codes (with system: AYU/SID/UNA)
2. Corresponding ICD-11 TM2 and MMS codes
3. Safety flags or warnings
4. Explanation in {request.language} language
5. Confidence score (0-1)

Format your response as JSON:
{{
    "suggested_codes": [
        {{"code": "AYU-D-0001", "system": "AYU", "name": "Vataja Jwara", "confidence": 0.85}}
    ],
    "icd11_maps": [
        {{"tm2_code": "TM2-SC04", "mms_code": "5A10.0", "confidence": 0.80}}
    ],
    "safety_flags": ["Consult physician for confirmation"],
    "explanation": "Detailed explanation...",
    "confidence_score": 0.82
}}
"""
            
            # Call LLM
            llm_response = await self.call_llm(prompt, max_tokens=800)
            
            # Parse LLM response
            try:
                llm_data = json.loads(llm_response)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                llm_data = {
                    "suggested_codes": [],
                    "icd11_maps": [],
                    "safety_flags": ["AI response parsing failed"],
                    "explanation": llm_response,
                    "confidence_score": 0.0
                }
            
            # Validate suggested codes against database
            validated_codes = []
            for code_data in llm_data.get("suggested_codes", []):
                result = await db.execute(
                    select(NamasteCode).where(NamasteCode.code == code_data["code"])
                )
                namaste_code = result.scalar_one_or_none()
                
                if namaste_code:
                    validated_codes.append({
                        "code": namaste_code.code,
                        "system": namaste_code.system,
                        "name": namaste_code.name_en,
                        "tm2_code": namaste_code.tm2_code,
                        "icd11_mms_code": namaste_code.icd11_mms_code,
                        "confidence": code_data.get("confidence", 0.5)
                    })
            
            # Create response
            response = RAGResponse(
                suggested_codes=validated_codes,
                icd11_maps=llm_data.get("icd11_maps", []),
                safety_flags=llm_data.get("safety_flags", []),
                explanation=llm_data.get("explanation", ""),
                confidence_score=llm_data.get("confidence_score", 0.0),
                retrieved_chunks=retrieved_chunks
            )
            
            # Store RAG session
            if request.patient_id:
                rag_session = RAGSession(
                    patient_id=request.patient_id,
                    user_id=user.id,
                    query=request.symptoms,
                    language=request.language,
                    retrieved_chunks=retrieved_chunks,
                    response=response.dict(),
                    model_used="llama3-70b-8192",
                    confidence_score=response.confidence_score
                )
                db.add(rag_session)
                await db.commit()
            
            return response
            
        except Exception as e:
            logger.error(f"RAG diagnosis error: {e}")
            return RAGResponse(
                suggested_codes=[],
                icd11_maps=[],
                safety_flags=["RAG service error occurred"],
                explanation="An error occurred during diagnosis. Please try again.",
                confidence_score=0.0,
                retrieved_chunks=[]
            )
    
    async def recommend_medicine_with_rag(self, request: RAGMedicineRequest, user: User, db: AsyncSession) -> Dict[str, Any]:
        """Recommend medicines using RAG"""
        try:
            # Get NAMASTE code details
            result = await db.execute(
                select(NamasteCode).where(NamasteCode.code == request.namaste_code)
            )
            namaste_code = result.scalar_one_or_none()
            
            if not namaste_code:
                return {
                    "medicines": [],
                    "dosage": "",
                    "contraindications": ["NAMASTE code not found"],
                    "clinician_note": "Invalid NAMASTE code provided."
                }
            
            # Build safety context
            safety_context = []
            if request.pregnancy:
                safety_context.append("Patient is pregnant - avoid teratogenic herbs")
            if request.cardiac_history:
                safety_context.append("Patient has cardiac history - avoid cardiac stimulants")
            if request.age < 18:
                safety_context.append("Patient is pediatric - use reduced dosage")
            if request.age > 65:
                safety_context.append("Patient is elderly - use reduced dosage")
            
            # Build current medications context
            if request.current_meds:
                safety_context.append(f"Current medications: {', '.join(request.current_meds)}")
            
            # Retrieve relevant chunks
            query = f"{namaste_code.code} {namaste_code.name_en} treatment medicines"
            retrieved_chunks = await self.retrieve_relevant_chunks(query)
            
            # Build context for LLM
            context = "\n\n".join([
                f"Source: {chunk['source']}\n{chunk['text']}" 
                for chunk in retrieved_chunks
            ])
            
            # Create prompt
            prompt = f"""
Based on the following AYUSH medical knowledge and safety considerations, recommend medicines for the NAMASTE condition.

NAMASTE Code: {namaste_code.code}
Condition: {namaste_code.name_en}
Description: {namaste_code.description}

Safety Considerations:
{chr(10).join(safety_context)}

Knowledge Base Context:
{context}

Please provide:
1. Recommended medicines (herbs and formulations)
2. Dosage guidelines
3. Contraindications and warnings
4. Clinician confirmation note

Format your response as JSON:
{{
    "medicines": [
        {{"name": "Ashwagandha", "form": "Powder", "dosage": "1-2g twice daily"}}
    ],
    "dosage": "General dosage guidelines...",
    "contraindications": ["Pregnancy", "Cardiac conditions"],
    "clinician_note": "Clinician confirmation required before administration."
}}
"""
            
            # Call LLM
            llm_response = await self.call_llm(prompt, max_tokens=600)
            
            # Parse LLM response
            try:
                llm_data = json.loads(llm_response)
            except json.JSONDecodeError:
                llm_data = {
                    "medicines": [],
                    "dosage": "Unable to parse AI response",
                    "contraindications": ["AI response parsing failed"],
                    "clinician_note": "Please consult with qualified AYUSH practitioner."
                }
            
            # Add mandatory safety warnings
            mandatory_warnings = ["Clinician confirmation required before administration"]
            if request.pregnancy:
                mandatory_warnings.append("Pregnancy - consult physician before use")
            if request.cardiac_history:
                mandatory_warnings.append("Cardiac history - monitor vital signs")
            
            llm_data["contraindications"].extend(mandatory_warnings)
            
            # Store RAG session
            if request.patient_id:
                rag_session = RAGSession(
                    patient_id=request.patient_id,
                    user_id=user.id,
                    query=f"Medicine recommendation for {request.namaste_code}",
                    language="en",
                    retrieved_chunks=retrieved_chunks,
                    response=llm_data,
                    model_used="llama3-70b-8192",
                    confidence_score=0.8
                )
                db.add(rag_session)
                await db.commit()
            
            return llm_data
            
        except Exception as e:
            logger.error(f"RAG medicine recommendation error: {e}")
            return {
                "medicines": [],
                "dosage": "",
                "contraindications": ["RAG service error occurred"],
                "clinician_note": "An error occurred during medicine recommendation. Please try again."
            }
    
    async def explain_namaste_code(self, namaste_code: str, language: str = "en", user: User = None, db: AsyncSession = None) -> Dict[str, Any]:
        """Explain NAMASTE code using RAG"""
        try:
            # Get NAMASTE code details
            result = await db.execute(
                select(NamasteCode).where(NamasteCode.code == namaste_code)
            )
            code = result.scalar_one_or_none()
            
            if not code:
                return {
                    "code": namaste_code,
                    "explanation": f"NAMASTE code {namaste_code} not found in database.",
                    "details": {},
                    "related_codes": []
                }
            
            # Retrieve relevant chunks
            query = f"{code.code} {code.name_en} explanation details"
            retrieved_chunks = await self.retrieve_relevant_chunks(query)
            
            # Build context for LLM
            context = "\n\n".join([
                f"Source: {chunk['source']}\n{chunk['text']}" 
                for chunk in retrieved_chunks
            ])
            
            # Create prompt
            prompt = f"""
Based on the following AYUSH medical knowledge, provide a comprehensive explanation of the NAMASTE code.

NAMASTE Code: {code.code}
System: {code.system}
Name: {code.name_en}
Description: {code.description}
Dosha: {code.dosha or 'Not specified'}

Knowledge Base Context:
{context}

Please provide a detailed explanation in {language} language covering:
1. Condition description
2. Etiology and pathogenesis
3. Clinical features
4. Diagnostic criteria
5. Treatment principles
6. Prognosis

Format your response as JSON:
{{
    "explanation": "Detailed explanation...",
    "details": {{
        "etiology": "...",
        "clinical_features": "...",
        "diagnostic_criteria": "...",
        "treatment_principles": "...",
        "prognosis": "..."
    }},
    "related_codes": ["AYU-D-0002", "AYU-D-0003"]
}}
"""
            
            # Call LLM
            llm_response = await self.call_llm(prompt, max_tokens=800)
            
            # Parse LLM response
            try:
                llm_data = json.loads(llm_response)
            except json.JSONDecodeError:
                llm_data = {
                    "explanation": llm_response,
                    "details": {},
                    "related_codes": []
                }
            
            # Add basic code information
            response = {
                "code": code.code,
                "system": code.system,
                "name_en": code.name_en,
                "name_ta": code.name_ta,
                "name_hi": code.name_hi,
                "description": code.description,
                "category": code.category,
                "dosha": code.dosha,
                "tm2_code": code.tm2_code,
                "icd11_mms_code": code.icd11_mms_code,
                **llm_data
            }
            
            # Store RAG session
            if user and db:
                rag_session = RAGSession(
                    patient_id=None,
                    user_id=user.id,
                    query=f"Explain {namaste_code}",
                    language=language,
                    retrieved_chunks=retrieved_chunks,
                    response=response,
                    model_used="llama3-70b-8192",
                    confidence_score=0.9
                )
                db.add(rag_session)
                await db.commit()
            
            return response
            
        except Exception as e:
            logger.error(f"NAMASTE code explanation error: {e}")
            return {
                "code": namaste_code,
                "explanation": f"Error occurred while explaining {namaste_code}: {str(e)}",
                "details": {},
                "related_codes": []
            }
    
    async def extract_symptoms_nlp(self, text: str, language: str = "en") -> List[str]:
        """Extract symptoms using NLP"""
        try:
            # Translate text if needed
            if language != "en":
                text = await self.translate_text(text, "en")
            
            # For demo, use simple keyword extraction
            # In production, integrate with spaCy or similar NLP library
            
            symptom_keywords = [
                "fever", "cough", "cold", "headache", "body pain", "fatigue",
                "nausea", "vomiting", "diarrhea", "constipation", "abdominal pain",
                "chest pain", "shortness of breath", "wheezing", "palpitations",
                "joint pain", "swelling", "stiffness", "numbness", "tingling",
                "dizziness", "vertigo", "anxiety", "depression", "insomnia",
                "loss of appetite", "weight loss", "thirst", "dry mouth",
                "skin rash", "itching", "redness", "burning sensation"
            ]
            
            text_lower = text.lower()
            extracted_symptoms = []
            
            for keyword in symptom_keywords:
                if keyword in text_lower:
                    extracted_symptoms.append(keyword)
            
            # Remove duplicates and return
            return list(set(extracted_symptoms))
            
        except Exception as e:
            logger.error(f"Symptom extraction error: {e}")
            return []
    
    async def get_rag_session_history(self, patient_id: str, user: User, db: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
        """Get RAG session history for a patient"""
        try:
            result = await db.execute(
                select(RAGSession)
                .where(RAGSession.patient_id == patient_id)
                .order_by(RAGSession.created_at.desc())
                .limit(limit)
            )
            
            sessions = result.scalars().all()
            
            history = []
            for session in sessions:
                history.append({
                    "id": str(session.id),
                    "query": session.query,
                    "language": session.language,
                    "response": session.response,
                    "model_used": session.model_used,
                    "confidence_score": session.confidence_score,
                    "created_at": session.created_at.isoformat()
                })
            
            return history
            
        except Exception as e:
            logger.error(f"RAG session history error: {e}")
            return []
    
    async def get_rag_statistics(self, user: User, db: AsyncSession) -> Dict[str, Any]:
        """Get RAG usage statistics"""
        try:
            # Total sessions
            total_result = await db.execute(
                select(RAGSession).where(RAGSession.user_id == user.id)
            )
            total_sessions = len(total_result.scalars().all())
            
            # Sessions by language
            language_stats = {}
            for lang in ["en", "ta", "hi"]:
                lang_result = await db.execute(
                    select(RAGSession)
                    .where(RAGSession.user_id == user.id)
                    .where(RAGSession.language == lang)
                )
                language_stats[lang] = len(lang_result.scalars().all())
            
            # Average confidence score
            confidence_result = await db.execute(
                select(RAGSession.confidence_score)
                .where(RAGSession.user_id == user.id)
                .where(RAGSession.confidence_score.isnot(None))
            )
            confidence_scores = confidence_result.scalars().all()
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            # Most used model
            model_result = await db.execute(
                select(RAGSession.model_used, func.count(RAGSession.model_used))
                .where(RAGSession.user_id == user.id)
                .group_by(RAGSession.model_used)
                .order_by(func.count(RAGSession.model_used).desc())
            )
            model_stats = dict(model_result.all())
            
            return {
                "total_sessions": total_sessions,
                "language_distribution": language_stats,
                "average_confidence_score": avg_confidence,
                "model_usage": model_stats
            }
            
        except Exception as e:
            logger.error(f"RAG statistics error: {e}")
            return {}


# Global RAG service instance
rag_service = RAGService()
