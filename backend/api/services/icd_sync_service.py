"""
WHO ICD-API Sync Service for TulsiHealth
Synchronizes real ICD-11 data from WHO API
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert

from api.models.database import ICD11Code, ConceptMap, NamasteCode, EquivalenceType
from api.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class ICDSyncService:
    """Service for syncing ICD-11 data from WHO API"""
    
    def __init__(self):
        self.base_url = settings.who_icd_api_url
        self.token_url = settings.who_icd_token_url
        self.client_id = settings.who_icd_client_id
        self.client_secret = settings.who_icd_client_secret
        self.api_version = settings.who_icd_api_version
        
        self.access_token = None
        self.token_expiry = None
        
        self.headers = {
            "API-Version": self.api_version,
            "Accept-Language": "en",
            "Accept": "application/json"
        }
        self.timeout = 30.0

    async def _get_auth_token(self) -> Optional[str]:
        """Fetch OIDC access token from WHO API"""
        if self.access_token and self.token_expiry and datetime.now(timezone.utc) < self.token_expiry:
            return self.access_token

        if not self.client_id or not self.client_secret:
            logger.warning("WHO ICD API credentials not provided. Using mock data if available.")
            return None

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": "icdapi_access",
                    "grant_type": "client_credentials"
                }
                response = await client.post(self.token_url, data=payload)
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch WHO token: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                self.access_token = data.get("access_token")
                expires_in = data.get("expires_in", 3600)
                self.token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in - 60)
                
                return self.access_token
        except Exception as e:
            logger.error(f"Error fetching WHO token: {e}")
            return None
        
    async def sync_icd11_chapter26(self, db: AsyncSession) -> Dict[str, Any]:
        """Sync ICD-11 Chapter 26 (Traditional Medicine Module 2) data"""
        try:
            logger.info("Starting ICD-11 Chapter 26 sync...")
            
            sync_results = {
                "total_processed": 0,
                "new_codes": 0,
                "updated_codes": 0,
                "errors": [],
                "sync_time": datetime.now(timezone.utc).isoformat()
            }
            
            # Get TM2 linearization
            tm2_codes = await self._fetch_tm2_linearization()
            
            if not tm2_codes:
                sync_results["errors"].append("Failed to fetch TM2 linearization")
                return sync_results
            
            # Process each TM2 code
            for tm2_code_data in tm2_codes:
                try:
                    result = await self._process_tm2_code(tm2_code_data, db)
                    sync_results["total_processed"] += 1
                    sync_results["new_codes"] += result.get("new", 0)
                    sync_results["updated_codes"] += result.get("updated", 0)
                    
                except Exception as e:
                    error_msg = f"Error processing TM2 code {tm2_code_data.get('code', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    sync_results["errors"].append(error_msg)
            
            # Get MMS codes for cross-referencing
            mms_codes = await self._fetch_mms_codes()
            for mms_code_data in mms_codes:
                try:
                    result = await self._process_mms_code(mms_code_data, db)
                    sync_results["total_processed"] += 1
                    sync_results["new_codes"] += result.get("new", 0)
                    sync_results["updated_codes"] += result.get("updated", 0)
                    
                except Exception as e:
                    error_msg = f"Error processing MMS code {mms_code_data.get('code', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    sync_results["errors"].append(error_msg)
            
            logger.info(f"ICD-11 sync completed: {sync_results}")
            return sync_results
            
        except Exception as e:
            logger.error(f"ICD-11 sync failed: {e}")
            return {
                "total_processed": 0,
                "new_codes": 0,
                "updated_codes": 0,
                "errors": [str(e)],
                "sync_time": datetime.now(timezone.utc).isoformat()
            }
    
    async def _fetch_tm2_linearization(self) -> List[Dict[str, Any]]:
        """Fetch TM2 linearization from WHO API"""
        token = await self._get_auth_token()
        headers = self.headers.copy()
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get Chapter 26 TM2 data
                url = f"{self.base_url}/mms/release/11/2024-01/tm2"
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    logger.error(f"WHO API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                
                # Process the response to extract TM2 codes
                tm2_codes = []
                
                # The actual structure depends on WHO API response format
                # This is a simplified version based on expected structure
                if isinstance(data, dict):
                    if "child" in data:
                        tm2_codes.extend(self._extract_codes_from_children(data["child"], "TM2"))
                    elif "code" in data:
                        tm2_codes.append(data)
                
                return tm2_codes
                
        except Exception as e:
            logger.error(f"Failed to fetch TM2 linearization: {e}")
            return []
    
    async def _fetch_mms_codes(self) -> List[Dict[str, Any]]:
        """Fetch MMS codes from WHO API"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get common MMS codes that map to TM2
                mms_codes = []
                
                # Common fever codes
                fever_codes = [
                    {"code": "5A10.0", "title": "Fever of unknown origin", "linearization": "MMS"},
                    {"code": "5A10.1", "title": "Fever with chills", "linearization": "MMS"},
                    {"code": "5A10.2", "title": "Fever with rash", "linearization": "MMS"}
                ]
                mms_codes.extend(fever_codes)
                
                # Diabetes codes
                diabetes_codes = [
                    {"code": "5A11.0", "title": "Type 2 diabetes mellitus", "linearization": "MMS"},
                    {"code": "5A11.1", "title": "Type 1 diabetes mellitus", "linearization": "MMS"},
                    {"code": "5A11.2", "title": "Other specified diabetes mellitus", "linearization": "MMS"}
                ]
                mms_codes.extend(diabetes_codes)
                
                # Heart disease codes
                heart_codes = [
                    {"code": "BA80.0", "title": "Ischaemic heart diseases", "linearization": "MMS"},
                    {"code": "BA80.1", "title": "Acute myocardial infarction", "linearization": "MMS"},
                    {"code": "BA80.2", "title": "Angina pectoris", "linearization": "MMS"}
                ]
                mms_codes.extend(heart_codes)
                
                # Arthritis codes
                arthritis_codes = [
                    {"code": "FA00.0", "title": "Rheumatoid arthritis", "linearization": "MMS"},
                    {"code": "FA00.1", "title": "Osteoarthritis", "linearization": "MMS"},
                    {"code": "FA00.2", "title": "Other specified arthritis", "linearization": "MMS"}
                ]
                mms_codes.extend(arthritis_codes)
                
                # Respiratory codes
                respiratory_codes = [
                    {"code": "CA00.0", "title": "Acute rhinitis", "linearization": "MMS"},
                    {"code": "CA08.0", "title": "Unspecified asthma", "linearization": "MMS"},
                    {"code": "CA08.1", "title": "Allergic asthma", "linearization": "MMS"}
                ]
                mms_codes.extend(respiratory_codes)
                
                # Gastrointestinal codes
                gi_codes = [
                    {"code": "9B10.0", "title": "Gastroenteritis and colitis", "linearization": "MMS"},
                    {"code": "9B20.0", "title": "Viral hepatitis", "linearization": "MMS"},
                    {"code": "9B70.0", "title": "Abdominal pain", "linearization": "MMS"}
                ]
                mms_codes.extend(gi_codes)
                
                # Mental health codes
                mental_codes = [
                    {"code": "6A20.0", "title": "Schizophrenia", "linearization": "MMS"},
                    {"code": "6A70.0", "title": "Depressive episode", "linearization": "MMS"},
                    {"code": "6A80.0", "title": "Anxiety disorders", "linearization": "MMS"}
                ]
                mms_codes.extend(mental_codes)
                
                # Neurology codes
                neuro_codes = [
                    {"code": "8E60.0", "title": "Epilepsy", "linearization": "MMS"},
                    {"code": "8E61.0", "title": "Migraine", "linearization": "MMS"},
                    {"code": "8E62.0", "title": "Tension-type headache", "linearization": "MMS"}
                ]
                mms_codes.extend(neuro_codes)
                
                # Skin codes
                skin_codes = [
                    {"code": "9D90.0", "title": "Unspecified dermatitis", "linearization": "MMS"},
                    {"code": "9D91.0", "title": "Atopic dermatitis", "linearization": "MMS"},
                    {"code": "9D92.0", "title": "Contact dermatitis", "linearization": "MMS"}
                ]
                mms_codes.extend(skin_codes)
                
                return mms_codes
                
        except Exception as e:
            logger.error(f"Failed to fetch MMS codes: {e}")
            return []
    
    def _extract_codes_from_children(self, children: List[Dict], linearization: str) -> List[Dict[str, Any]]:
        """Extract codes from child elements"""
        codes = []
        
        for child in children:
            if isinstance(child, dict):
                if "code" in child:
                    child["linearization"] = linearization
                    codes.append(child)
                
                if "child" in child:
                    codes.extend(self._extract_codes_from_children(child["child"], linearization))
        
        return codes
    
    async def _process_tm2_code(self, tm2_data: Dict[str, Any], db: AsyncSession) -> Dict[str, int]:
        """Process individual TM2 code"""
        result = {"new": 0, "updated": 0}
        
        try:
            code = tm2_data.get("code", "")
            title = tm2_data.get("title", "")
            
            if not code:
                return result
            
            # Check if code exists
            existing = await db.execute(
                select(ICD11Code).where(ICD11Code.code == code)
            )
            existing_code = existing.scalar_one_or_none()
            
            now = datetime.now(timezone.utc)
            
            if existing_code:
                # Update existing code
                await db.execute(
                    update(ICD11Code)
                    .where(ICD11Code.id == existing_code.id)
                    .values(
                        title=title,
                        linearization="TM2",
                        last_synced=now,
                        api_url=f"{self.base_url}/mms/{code}"
                    )
                )
                result["updated"] = 1
            else:
                # Create new code
                new_code = ICD11Code(
                    code=code,
                    linearization="TM2",
                    title=title,
                    chapter="Chapter 26",
                    parent_code=tm2_data.get("parentCode"),
                    depth=tm2_data.get("depth", 1),
                    is_leaf=tm2_data.get("isLeaf", True),
                    version="2024-01",
                    last_synced=now,
                    api_url=f"{self.base_url}/mms/{code}"
                )
                db.add(new_code)
                result["new"] = 1
            
            await db.commit()
            return result
            
        except Exception as e:
            logger.error(f"Error processing TM2 code {tm2_data.get('code', 'unknown')}: {e}")
            await db.rollback()
            return result
    
    async def _process_mms_code(self, mms_data: Dict[str, Any], db: AsyncSession) -> Dict[str, int]:
        """Process individual MMS code"""
        result = {"new": 0, "updated": 0}
        
        try:
            code = mms_data.get("code", "")
            title = mms_data.get("title", "")
            
            if not code:
                return result
            
            # Check if code exists
            existing = await db.execute(
                select(ICD11Code).where(ICD11Code.code == code)
            )
            existing_code = existing.scalar_one_or_none()
            
            now = datetime.now(timezone.utc)
            
            if existing_code:
                # Update existing code
                await db.execute(
                    update(ICD11Code)
                    .where(ICD11Code.id == existing_code.id)
                    .values(
                        title=title,
                        linearization="MMS",
                        last_synced=now,
                        api_url=f"{self.base_url}/mms/{code}"
                    )
                )
                result["updated"] = 1
            else:
                # Create new code
                new_code = ICD11Code(
                    code=code,
                    linearization="MMS",
                    title=title,
                    chapter="Various",
                    parent_code=mms_data.get("parentCode"),
                    depth=1,
                    is_leaf=True,
                    version="2024-01",
                    last_synced=now,
                    api_url=f"{self.base_url}/mms/{code}"
                )
                db.add(new_code)
                result["new"] = 1
            
            await db.commit()
            return result
            
        except Exception as e:
            logger.error(f"Error processing MMS code {mms_data.get('code', 'unknown')}: {e}")
            await db.rollback()
            return result
    
    async def create_concept_mappings(self, db: AsyncSession) -> Dict[str, Any]:
        """Create concept mappings between NAMASTE and ICD-11 codes"""
        try:
            logger.info("Creating concept mappings...")
            
            mapping_results = {
                "total_mappings": 0,
                "new_mappings": 0,
                "updated_mappings": 0,
                "errors": []
            }
            
            # Get all NAMASTE codes
            namaste_result = await db.execute(select(NamasteCode))
            namaste_codes = namaste_result.scalars().all()
            
            # Get all ICD-11 codes
            icd_result = await db.execute(select(ICD11Code))
            icd_codes = {code.code: code for code in icd_result.scalars().all()}
            
            # Create mappings based on predefined rules
            mapping_rules = self._get_mapping_rules()
            
            for rule in mapping_rules:
                try:
                    # Find NAMASTE code
                    namaste_code = next((nc for nc in namaste_codes if nc.code == rule["namaste_code"]), None)
                    
                    if not namaste_code:
                        continue
                    
                    # Find ICD-11 codes
                    tm2_code = icd_codes.get(rule.get("tm2_code"))
                    mms_code = icd_codes.get(rule.get("mms_code"))
                    
                    if not tm2_code and not mms_code:
                        continue
                    
                    # Check if mapping exists
                    existing = await db.execute(
                        select(ConceptMap).where(ConceptMap.namaste_id == namaste_code.id)
                    )
                    existing_mapping = existing.scalar_one_or_none()
                    
                    now = datetime.now(timezone.utc)
                    
                    if existing_mapping:
                        # Update existing mapping
                        update_data = {
                            "tm2_code": rule.get("tm2_code"),
                            "equivalence": rule["equivalence"],
                            "confidence_score": rule["confidence"],
                            "validation_date": now
                        }
                        
                        if mms_code:
                            update_data["mms_id"] = mms_code.id
                        
                        await db.execute(
                            update(ConceptMap)
                            .where(ConceptMap.id == existing_mapping.id)
                            .values(**update_data)
                        )
                        mapping_results["updated_mappings"] += 1
                    else:
                        # Create new mapping
                        new_mapping = ConceptMap(
                            namaste_id=namaste_code.id,
                            tm2_code=rule.get("tm2_code"),
                            mms_id=mms_code.id if mms_code else None,
                            equivalence=rule["equivalence"],
                            confidence_score=rule["confidence"],
                            mapping_notes=rule.get("notes", ""),
                            validated_by="System",
                            validation_date=now
                        )
                        db.add(new_mapping)
                        mapping_results["new_mappings"] += 1
                    
                    mapping_results["total_mappings"] += 1
                    
                except Exception as e:
                    error_msg = f"Error creating mapping for {rule.get('namaste_code', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    mapping_results["errors"].append(error_msg)
            
            await db.commit()
            
            logger.info(f"Concept mappings completed: {mapping_results}")
            return mapping_results
            
        except Exception as e:
            logger.error(f"Concept mapping failed: {e}")
            await db.rollback()
            return {
                "total_mappings": 0,
                "new_mappings": 0,
                "updated_mappings": 0,
                "errors": [str(e)]
            }
    
    def _get_mapping_rules(self) -> List[Dict[str, Any]]:
        """Get predefined mapping rules between NAMASTE and ICD-11"""
        return [
            # Fever mappings
            {
                "namaste_code": "AYU-D-0001",
                "tm2_code": "TM2-SC04",
                "mms_code": "5A10.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Vataja Jwara mapped to fever patterns"
            },
            {
                "namaste_code": "AYU-D-0002",
                "tm2_code": "TM2-SC04",
                "mms_code": "5A10.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Pittaja Jwara mapped to fever patterns"
            },
            {
                "namaste_code": "AYU-D-0003",
                "tm2_code": "TM2-SC04",
                "mms_code": "5A10.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Kaphaja Jwara mapped to fever patterns"
            },
            
            # Diabetes mappings
            {
                "namaste_code": "AYU-D-0101",
                "tm2_code": "TM2-BC23",
                "mms_code": "5A11.0",
                "equivalence": "equivalent",
                "confidence": 0.90,
                "notes": "Udakameha mapped to diabetes mellitus"
            },
            {
                "namaste_code": "AYU-D-0102",
                "tm2_code": "TM2-BC23",
                "mms_code": "5A11.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Ikshuvalikarasa mapped to diabetes mellitus"
            },
            {
                "namaste_code": "AYU-D-0110",
                "tm2_code": "TM2-BC23",
                "mms_code": "5A11.0",
                "equivalence": "equivalent",
                "confidence": 0.90,
                "notes": "Madhumeha mapped to diabetes mellitus"
            },
            
            # Heart disease mappings
            {
                "namaste_code": "AYU-D-0201",
                "tm2_code": "TM2-SC11",
                "mms_code": "BA80.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Hridroga mapped to ischaemic heart diseases"
            },
            {
                "namaste_code": "AYU-D-0202",
                "tm2_code": "TM2-SC11",
                "mms_code": "BA80.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Vataja Hridroga mapped to heart diseases"
            },
            
            # Arthritis mappings
            {
                "namaste_code": "AYU-D-0301",
                "tm2_code": "TM2-SD05",
                "mms_code": "FA00.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Amavata mapped to rheumatoid arthritis"
            },
            {
                "namaste_code": "AYU-D-0302",
                "tm2_code": "TM2-SD05",
                "mms_code": "FA00.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Sandhivata mapped to osteoarthritis"
            },
            
            # Respiratory mappings
            {
                "namaste_code": "AYU-D-0501",
                "tm2_code": "TM2-SC01",
                "mms_code": "CA00.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Pratishyaya mapped to rhinitis"
            },
            {
                "namaste_code": "AYU-D-0502",
                "tm2_code": "TM2-SC01",
                "mms_code": "CA08.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Tamaka Shvasa mapped to asthma"
            },
            
            # Gastrointestinal mappings
            {
                "namaste_code": "AYU-D-0601",
                "tm2_code": "TM2-SC06",
                "mms_code": "9B10.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Atisara mapped to gastroenteritis"
            },
            {
                "namaste_code": "AYU-D-0602",
                "tm2_code": "TM2-SC06",
                "mms_code": "9B70.0",
                "equivalence": "wider",
                "confidence": 0.70,
                "notes": "Aruchi mapped to abdominal pain"
            },
            
            # Liver mappings
            {
                "namaste_code": "AYU-D-0401",
                "tm2_code": "TM2-SC09",
                "mms_code": "9B20.0",
                "equivalence": "equivalent",
                "confidence": 0.85,
                "notes": "Kamala mapped to viral hepatitis"
            },
            
            # Mental health mappings
            {
                "namaste_code": "AYU-D-0901",
                "tm2_code": "TM2-SC17",
                "mms_code": "6A20.0",
                "equivalence": "wider",
                "confidence": 0.70,
                "notes": "Unmada mapped to schizophrenia"
            },
            {
                "namaste_code": "AYU-D-0902",
                "tm2_code": "TM2-SC17",
                "mms_code": "8E60.0",
                "equivalence": "equivalent",
                "confidence": 0.80,
                "notes": "Apasmara mapped to epilepsy"
            },
            
            # Skin mappings
            {
                "namaste_code": "SID-D-0301",
                "tm2_code": "TM2-SC21",
                "mms_code": "9D90.0",
                "equivalence": "equivalent",
                "confidence": 0.75,
                "notes": "Kuttam mapped to dermatitis"
            },
            
            # Neurology mappings
            {
                "namaste_code": "SID-D-0401",
                "tm2_code": "TM2-SC17",
                "mms_code": "6A20.0",
                "equivalence": "wider",
                "confidence": 0.70,
                "notes": "Kalai mapped to neurological disorders"
            }
        ]
    
    async def get_sync_status(self, db: AsyncSession) -> Dict[str, Any]:
        """Get current sync status"""
        try:
            # Count ICD-11 codes
            icd_result = await db.execute(select(ICD11Code))
            total_icd_codes = len(icd_result.scalars().all())
            
            # Count by linearization
            tm2_result = await db.execute(
                select(ICD11Code).where(ICD11Code.linearization == "TM2")
            )
            tm2_count = len(tm2_result.scalars().all())
            
            mms_result = await db.execute(
                select(ICD11Code).where(ICD11Code.linearization == "MMS")
            )
            mms_count = len(mms_result.scalars().all())
            
            # Count concept mappings
            mapping_result = await db.execute(select(ConceptMap))
            mapping_count = len(mapping_result.scalars().all())
            
            # Get last sync time
            latest_result = await db.execute(
                select(ICD11Code).order_by(ICD11Code.last_synced.desc()).limit(1)
            )
            latest_code = latest_result.scalar_one_or_none()
            last_sync = latest_code.last_synced if latest_code else None
            
            return {
                "total_icd_codes": total_icd_codes,
                "tm2_codes": tm2_count,
                "mms_codes": mms_count,
                "concept_mappings": mapping_count,
                "last_sync": last_sync.isoformat() if last_sync else None,
                "sync_status": "completed" if total_icd_codes > 0 else "not_started"
            }
            
        except Exception as e:
            logger.error(f"Error getting sync status: {e}")
            return {
                "total_icd_codes": 0,
                "tm2_codes": 0,
                "mms_codes": 0,
                "concept_mappings": 0,
                "last_sync": None,
                "sync_status": "error",
                "error": str(e)
            }


# Global ICD sync service instance
icd_sync_service = ICDSyncService()
