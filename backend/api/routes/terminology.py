"""
Terminology Routes for TulsiHealth
Handles ICD-11 sync, terminology search, and concept mapping
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from pydantic import BaseModel

from api.models.database import User, UserRole, NamasteCode, ICD11Code, ConceptMap
from api.services.icd_sync_service import icd_sync_service
from api.database import get_db
from api.deps import get_current_active_user, require_role

router = APIRouter()


class SyncRequest(BaseModel):
    """Request model for ICD-11 sync"""
    sync_type: str = "full"  # full, incremental
    create_mappings: bool = True


class CodeSearchRequest(BaseModel):
    """Request model for code search"""
    query: str
    systems: List[str] = ["namaste", "tm2", "mms"]
    language: str = "en"
    limit: int = 20
    
    @property
    def valid_systems(self) -> List[str]:
        """Validate and return valid systems"""
        valid = ["namaste", "tm2", "mms"]
        return [s for s in self.systems if s in valid]


class TranslateRequest(BaseModel):
    """Request model for code translation"""
    source_code: str
    source_system: str
    target_system: str


@router.post("/icd11/sync", response_model=Dict[str, Any])
async def sync_icd11(
    request: SyncRequest,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Sync ICD-11 data from WHO API"""
    try:
        logger.info(f"Starting ICD-11 sync: {request.sync_type}")
        
        # Sync ICD-11 codes
        sync_results = await icd_sync_service.sync_icd11_chapter26(db)
        
        # Create concept mappings if requested
        if request.create_mappings:
            mapping_results = await icd_sync_service.create_concept_mappings(db)
            sync_results["mappings"] = mapping_results
        
        return {
            "success": True,
            "message": "ICD-11 sync completed",
            "results": sync_results
        }
        
    except Exception as e:
        logger.error(f"ICD-11 sync failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ICD-11 sync failed: {str(e)}"
        )


@router.get("/icd11/sync/status", response_model=Dict[str, Any])
async def get_sync_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get ICD-11 sync status"""
    try:
        status = await icd_sync_service.get_sync_status(db)
        return status
        
    except Exception as e:
        logger.error(f"Failed to get sync status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )


@router.post("/search", response_model=Dict[str, Any])
async def search_codes(
    request: CodeSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Search across NAMASTE, TM2, and MMS codes"""
    try:
        results = {
            "namaste_codes": [],
            "tm2_codes": [],
            "mms_codes": [],
            "total_found": 0,
            "query": request.query,
            "systems_searched": request.valid_systems
        }
        
        search_term = f"%{request.query.lower()}%"
        
        # Search NAMASTE codes
        if "namaste" in request.valid_systems:
            namaste_query = select(NamasteCode).where(
                or_(
                    NamasteCode.code.ilike(search_term),
                    NamasteCode.name_en.ilike(search_term),
                    NamasteCode.description.ilike(search_term),
                    NamasteCode.name_ta.ilike(search_term) if request.language == "ta" else False,
                    NamasteCode.name_hi.ilike(search_term) if request.language == "hi" else False
                )
            ).limit(request.limit)
            
            namaste_result = await db.execute(namaste_query)
            namaste_codes = namaste_result.scalars().all()
            
            results["namaste_codes"] = [
                {
                    "code": code.code,
                    "system": code.system,
                    "name": code.name_en,
                    "name_ta": code.name_ta,
                    "name_hi": code.name_hi,
                    "description": code.description,
                    "category": code.category,
                    "dosha": code.dosha,
                    "tm2_code": code.tm2_code,
                    "icd11_mms_code": code.icd11_mms_code
                }
                for code in namaste_codes
            ]
        
        # Search TM2 codes
        if "tm2" in request.valid_systems:
            tm2_query = select(ICD11Code).where(
                and_(
                    ICD11Code.linearization == "TM2",
                    or_(
                        ICD11Code.code.ilike(search_term),
                        ICD11Code.title.ilike(search_term)
                    )
                )
            ).limit(request.limit)
            
            tm2_result = await db.execute(tm2_query)
            tm2_codes = tm2_result.scalars().all()
            
            results["tm2_codes"] = [
                {
                    "code": code.code,
                    "linearization": code.linearization,
                    "title": code.title,
                    "chapter": code.chapter,
                    "parent_code": code.parent_code,
                    "is_leaf": code.is_leaf
                }
                for code in tm2_codes
            ]
        
        # Search MMS codes
        if "mms" in request.valid_systems:
            mms_query = select(ICD11Code).where(
                and_(
                    ICD11Code.linearization == "MMS",
                    or_(
                        ICD11Code.code.ilike(search_term),
                        ICD11Code.title.ilike(search_term)
                    )
                )
            ).limit(request.limit)
            
            mms_result = await db.execute(mms_query)
            mms_codes = mms_result.scalars().all()
            
            results["mms_codes"] = [
                {
                    "code": code.code,
                    "linearization": code.linearization,
                    "title": code.title,
                    "chapter": code.chapter,
                    "parent_code": code.parent_code,
                    "is_leaf": code.is_leaf
                }
                for code in mms_codes
            ]
        
        # Calculate total
        results["total_found"] = (
            len(results["namaste_codes"]) +
            len(results["tm2_codes"]) +
            len(results["mms_codes"])
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Code search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code search failed: {str(e)}"
        )


@router.post("/translate", response_model=Dict[str, Any])
async def translate_code(
    request: TranslateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Translate code between systems"""
    try:
        # Validate systems
        valid_systems = ["namaste", "tm2", "mms"]
        if request.source_system not in valid_systems or request.target_system not in valid_systems:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid system. Must be one of: namaste, tm2, mms"
            )
        
        # Find source code
        if request.source_system == "namaste":
            source_result = await db.execute(
                select(NamasteCode).where(NamasteCode.code == request.source_code)
            )
            source_code = source_result.scalar_one_or_none()
            
            if not source_code:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="NAMASTE code not found"
                )
            
            # Get mappings
            mapping_result = await db.execute(
                select(ConceptMap).where(ConceptMap.namaste_id == source_code.id)
            )
            mapping = mapping_result.scalar_one_or_none()
            
            if not mapping:
                return {
                    "source_code": request.source_code,
                    "source_system": request.source_system,
                    "target_codes": [],
                    "message": "No mapping found"
                }
            
            # Get target codes
            target_codes = []
            
            if request.target_system == "tm2" and mapping.tm2_code:
                target_codes.append({
                    "code": mapping.tm2_code,
                    "system": "tm2",
                    "equivalence": mapping.equivalence.value,
                    "confidence": mapping.confidence_score
                })
            
            if request.target_system == "mms" and mapping.mms_id:
                # Get MMS code details
                mms_result = await db.execute(
                    select(ICD11Code).where(ICD11Code.id == mapping.mms_id)
                )
                mms_code = mms_result.scalar_one_or_none()
                
                if mms_code:
                    target_codes.append({
                        "code": mms_code.code,
                        "system": "mms",
                        "title": mms_code.title,
                        "equivalence": mapping.equivalence.value,
                        "confidence": mapping.confidence_score
                    })
            
            return {
                "source_code": request.source_code,
                "source_system": request.source_system,
                "target_system": request.target_system,
                "target_codes": target_codes,
                "mapping_notes": mapping.mapping_notes,
                "confidence": mapping.confidence_score
            }
        
        # Handle other system translations (TM2/MMS to NAMASTE)
        else:
            # Find ICD-11 code
            icd_result = await db.execute(
                select(ICD11Code).where(ICD11Code.code == request.source_code)
            )
            icd_code = icd_result.scalar_one_or_none()
            
            if not icd_code:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="ICD-11 code not found"
                )
            
            # Find mappings to NAMASTE
            if request.target_system == "namaste":
                if request.source_system == "tm2":
                    mapping_result = await db.execute(
                        select(ConceptMap).where(ConceptMap.tm2_code == request.source_code)
                    )
                else:  # mms
                    mapping_result = await db.execute(
                        select(ConceptMap).where(ConceptMap.mms_id == icd_code.id)
                    )
                
                mappings = mapping_result.scalars().all()
                
                target_codes = []
                for mapping in mappings:
                    # Get NAMASTE code details
                    namaste_result = await db.execute(
                        select(NamasteCode).where(NamasteCode.id == mapping.namaste_id)
                    )
                    namaste_code = namaste_result.scalar_one_or_none()
                    
                    if namaste_code:
                        target_codes.append({
                            "code": namaste_code.code,
                            "system": "namaste",
                            "name": namaste_code.name_en,
                            "name_ta": namaste_code.name_ta,
                            "name_hi": namaste_code.name_hi,
                            "equivalence": mapping.equivalence.value,
                            "confidence": mapping.confidence_score
                        })
                
                return {
                    "source_code": request.source_code,
                    "source_system": request.source_system,
                    "target_system": request.target_system,
                    "target_codes": target_codes
                }
        
        return {
            "source_code": request.source_code,
            "source_system": request.source_system,
            "target_system": request.target_system,
            "target_codes": [],
            "message": "Translation not supported for this system combination"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Code translation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code translation failed: {str(e)}"
        )


@router.get("/codesystem/namaste", response_model=Dict[str, Any])
async def get_namaste_codesystem(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get NAMASTE CodeSystem information"""
    try:
        # Get all NAMASTE codes
        result = await db.execute(select(NamasteCode))
        codes = result.scalars().all()
        
        # Group by system
        systems = {}
        for code in codes:
            if code.system not in systems:
                systems[code.system] = []
            
            systems[code.system].append({
                "code": code.code,
                "name": code.name_en,
                "name_ta": code.name_ta,
                "name_hi": code.name_hi,
                "description": code.description,
                "category": code.category,
                "dosha": code.dosha
            })
        
        return {
            "resourceType": "CodeSystem",
            "id": "namaste",
            "name": "NAMASTE",
            "title": "National Ayurveda, Siddha, Unani, Sowa-Rigpa, and Homeopathy Terminology",
            "status": "active",
            "content": "complete",
            "systems": systems,
            "total_codes": len(codes)
        }
        
    except Exception as e:
        logger.error(f"Failed to get NAMASTE CodeSystem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get NAMASTE CodeSystem: {str(e)}"
        )


@router.get("/conceptmap/namaste-to-tm2", response_model=Dict[str, Any])
async def get_namaste_to_tm2_conceptmap(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get NAMASTE to TM2 ConceptMap"""
    try:
        # Get all mappings
        result = await db.execute(
            select(ConceptMap, NamasteCode)
            .join(NamasteCode, ConceptMap.namaste_id == NamasteCode.id)
            .where(ConceptMap.tm2_code.isnot(None))
        )
        mappings = result.all()
        
        concept_map = {
            "resourceType": "ConceptMap",
            "id": "namaste-to-tm2",
            "name": "NAMASTE to ICD-11 TM2 Mapping",
            "status": "active",
            "source": "http://tulsihealth.in/fhir/CodeSystem/namaste",
            "target": "http://id.who.int/icd/release/11/2024-01/mms",
            "group": [
                {
                    "source": "http://tulsihealth.in/fhir/CodeSystem/namaste",
                    "target": "http://id.who.int/icd/release/11/2024-01/mms",
                    "element": [
                        {
                            "code": mapping.NamasteCode.code,
                            "display": mapping.NamasteCode.name_en,
                            "target": [
                                {
                                    "code": mapping.ConceptMap.tm2_code,
                                    "display": mapping.ConceptMap.tm2_code,
                                    "equivalence": mapping.ConceptMap.equivalence.value,
                                    "confidence": mapping.ConceptMap.confidence_score
                                }
                            ]
                        }
                        for mapping, _ in mappings
                    ]
                }
            ],
            "total_mappings": len(mappings)
        }
        
        return concept_map
        
    except Exception as e:
        logger.error(f"Failed to get ConceptMap: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get ConceptMap: {str(e)}"
        )


@router.get("/valueset/expand", response_model=Dict[str, Any])
async def expand_valueset(
    system: str = Query(..., description="CodeSystem to expand"),
    filter: Optional[str] = Query(None, description="Filter parameter"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Expand ValueSet for given system"""
    try:
        if system == "namaste":
            query = select(NamasteCode)
            
            if filter:
                query = query.where(NamasteCode.system == filter)
            
            result = await db.execute(query)
            codes = result.scalars().all()
            
            return {
                "resourceType": "ValueSet",
                "status": "active",
                "compose": {
                    "include": [
                        {
                            "system": "http://tulsihealth.in/fhir/CodeSystem/namaste",
                            "concept": [
                                {
                                    "code": code.code,
                                    "display": code.name_en,
                                    "designation": [
                                        {
                                            "language": "en",
                                            "value": code.description
                                        }
                                    ]
                                }
                                for code in codes[:100]  # Limit for demo
                            ]
                        }
                    ]
                },
                "total": len(codes)
            }
        
        elif system in ["tm2", "mms"]:
            query = select(ICD11Code).where(ICD11Code.linearization == system.upper())
            
            result = await db.execute(query)
            codes = result.scalars().all()
            
            return {
                "resourceType": "ValueSet",
                "status": "active",
                "compose": {
                    "include": [
                        {
                            "system": "http://id.who.int/icd/release/11/2024-01/mms",
                            "concept": [
                                {
                                    "code": code.code,
                                    "display": code.title
                                }
                                for code in codes[:100]  # Limit for demo
                            ]
                        }
                    ]
                },
                "total": len(codes)
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid system. Must be one of: namaste, tm2, mms"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to expand ValueSet: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to expand ValueSet: {str(e)}"
        )


@router.get("/suggest", response_model=List[Dict[str, Any]])
async def suggest_codes(
    q: str = Query(..., description="Query string"),
    lang: str = Query("en", description="Language"),
    systems: str = Query("namaste,tm2,mms", description="Comma-separated systems"),
    limit: int = Query(10, ge=1, le=20, description="Result limit"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get code suggestions for autocomplete"""
    try:
        # Parse systems
        system_list = [s.strip() for s in systems.split(",") if s.strip()]
        valid_systems = ["namaste", "tm2", "mms"]
        systems_to_search = [s for s in system_list if s in valid_systems]
        
        if not systems_to_search:
            systems_to_search = ["namaste"]  # Default to NAMASTE
        
        suggestions = []
        search_term = f"{q.lower()}%"
        
        # Search each system
        for system in systems_to_search:
            if system == "namaste":
                query = select(NamasteCode).where(
                    or_(
                        NamasteCode.code.ilike(search_term),
                        NamasteCode.name_en.ilike(search_term)
                    )
                ).limit(limit // len(systems_to_search))
                
                result = await db.execute(query)
                codes = result.scalars().all()
                
                for code in codes:
                    suggestions.append({
                        "code": code.code,
                        "system": "namaste",
                        "display": f"{code.code} - {code.name_en}",
                        "description": code.description[:100] + "..." if len(code.description) > 100 else code.description
                    })
            
            elif system in ["tm2", "mms"]:
                query = select(ICD11Code).where(
                    and_(
                        ICD11Code.linearization == system.upper(),
                        or_(
                            ICD11Code.code.ilike(search_term),
                            ICD11Code.title.ilike(search_term)
                        )
                    )
                ).limit(limit // len(systems_to_search))
                
                result = await db.execute(query)
                codes = result.scalars().all()
                
                for code in codes:
                    suggestions.append({
                        "code": code.code,
                        "system": system,
                        "display": f"{code.code} - {code.title}",
                        "description": code.chapter or ""
                    })
        
        # Sort by relevance (simple alphabetical for now)
        suggestions.sort(key=lambda x: x["display"])
        
        return suggestions[:limit]
        
    except Exception as e:
        logger.error(f"Code suggestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code suggestion failed: {str(e)}"
        )
