"""
TulsiHealth ML Service — Production Grade
NLP symptom extraction, recovery prediction, AYUSH medicine recommendation
"""

import re
import math
import hashlib
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from api.models.database import NamasteCode, ConceptMap, ICD11Code

logger = logging.getLogger(__name__)

# ── NAMASTE Code Knowledge Base ──────────────────────────────────────────────

NAMASTE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "namaste_code": "AYU-D-0001", "name": "Vataja Jwara", "icd11": "1D01",
        "tm2": "TM2-001", "tamil": "வாதஜ ஜ்வரம்",
        "keywords": ["fever", "jwara", "temperature", "hot", "chills", "vata", "pitta"],
        "symptoms": ["fever", "headache", "bodyache", "chills", "fatigue"],
        "category": "Jwara", "risk_base": 0.35,
        "contraindications": ["pregnancy", "heart_surgery"],
        "medicines": [
            {"name": "Sudarshana Churna", "dose": "500mg BD with warm water", "duration": "7 days"},
            {"name": "Tulsi Kwatha", "dose": "20ml TDS", "duration": "5 days"},
            {"name": "Mahasudarshana Vati", "dose": "2 tabs BD", "duration": "5 days"},
        ]
    },
    {
        "namaste_code": "AYU-D-0201", "name": "Prameha", "icd11": "5A11",
        "tm2": "TM2-201", "tamil": "பிரமேகம்",
        "keywords": ["diabetes", "prameha", "sugar", "glucose", "urine", "thirst", "madhumeha"],
        "symptoms": ["excessive thirst", "frequent urination", "fatigue", "blurred vision"],
        "category": "Prameha", "risk_base": 0.55,
        "contraindications": ["hypoglycemia"],
        "medicines": [
            {"name": "Triphala Churna", "dose": "5g at bedtime with warm water", "duration": "3 months"},
            {"name": "Karela Juice", "dose": "30ml morning fasting", "duration": "3 months"},
            {"name": "Gudmar (Gymnema)", "dose": "400mg BD before meals", "duration": "3 months"},
        ]
    },
    {
        "namaste_code": "AYU-D-0301", "name": "Amavata", "icd11": "FA20",
        "tm2": "TM2-301", "tamil": "ஆமவாதம்",
        "keywords": ["arthritis", "amavata", "joint", "pain", "swelling", "rheumatoid", "inflammation"],
        "symptoms": ["joint pain", "morning stiffness", "swelling", "fatigue"],
        "category": "Vata Disorders", "risk_base": 0.45,
        "contraindications": [],
        "medicines": [
            {"name": "Simhanada Guggulu", "dose": "2 tabs BD with warm water", "duration": "3 months"},
            {"name": "Dashamoolarishta", "dose": "20ml BD after food", "duration": "3 months"},
            {"name": "Rasnasaptaka Kwatha", "dose": "30ml TDS", "duration": "2 months"},
        ]
    },
    {
        "namaste_code": "AYU-D-0102", "name": "Kaphaja Kasa", "icd11": "CA23",
        "tm2": "TM2-102", "tamil": "கபஜ காசம்",
        "keywords": ["cough", "kasa", "bronchitis", "phlegm", "mucus", "respiratory", "breathing"],
        "symptoms": ["cough", "phlegm", "breathlessness", "chest heaviness"],
        "category": "Kasa", "risk_base": 0.30,
        "contraindications": [],
        "medicines": [
            {"name": "Sitopaladi Churna", "dose": "5g TDS with honey", "duration": "7 days"},
            {"name": "Vasavaleha", "dose": "10g BD", "duration": "7 days"},
        ]
    },
    {
        "namaste_code": "AYU-D-0401", "name": "Arsha", "icd11": "DB33",
        "tm2": "TM2-401", "tamil": "அர்சஸ்",
        "keywords": ["piles", "hemorrhoids", "arsha", "rectal", "bleeding", "constipation"],
        "symptoms": ["rectal bleeding", "pain during defecation", "constipation"],
        "category": "Ano-rectal Disorders", "risk_base": 0.25,
        "contraindications": [],
        "medicines": [
            {"name": "Arshakuthar Ras", "dose": "2 tabs BD after food", "duration": "1 month"},
            {"name": "Abhayarista", "dose": "20ml BD after food", "duration": "1 month"},
        ]
    },
    {
        "namaste_code": "AYU-D-0501", "name": "Sannipataja Jwara", "icd11": "1C82",
        "tm2": "TM2-501", "tamil": "சன்னிபாதஜ ஜ்வரம்",
        "keywords": ["typhoid", "enteric fever", "high fever", "abdominal", "weakness"],
        "symptoms": ["high fever", "abdominal pain", "weakness", "headache", "diarrhoea"],
        "category": "Jwara", "risk_base": 0.65,
        "contraindications": [],
        "medicines": [
            {"name": "Sanjivani Vati", "dose": "2 tabs TDS", "duration": "10 days"},
            {"name": "Amritarishta", "dose": "20ml BD after food", "duration": "10 days"},
        ]
    },
    {
        "namaste_code": "AYU-D-0602", "name": "Shwasa", "icd11": "CA22",
        "tm2": "TM2-602", "tamil": "ஸ்வாஸ ரோகம்",
        "keywords": ["asthma", "shwasa", "breathlessness", "wheezing", "respiratory", "dyspnea"],
        "symptoms": ["breathlessness", "wheezing", "chest tightness", "nocturnal cough"],
        "category": "Shwasa Disorders", "risk_base": 0.50,
        "contraindications": ["heart_surgery"],
        "medicines": [
            {"name": "Kanakasava", "dose": "20ml BD after food", "duration": "1 month"},
            {"name": "Shwaskuthar Ras", "dose": "2 tabs BD", "duration": "1 month"},
        ]
    },
    {
        "namaste_code": "AYU-D-0701", "name": "Pandu", "icd11": "3A00",
        "tm2": "TM2-701", "tamil": "பாண்டு ரோகம்",
        "keywords": ["anaemia", "anemia", "pandu", "pallor", "weakness", "fatigue", "iron"],
        "symptoms": ["pallor", "fatigue", "weakness", "breathlessness", "palpitations"],
        "category": "Pandu (Anaemia)", "risk_base": 0.40,
        "contraindications": [],
        "medicines": [
            {"name": "Mandura Vataka", "dose": "2 tabs BD with buttermilk", "duration": "2 months"},
            {"name": "Punarnavasava", "dose": "20ml BD after food", "duration": "2 months"},
        ]
    },
]

# ── Tamil/English keyword map ─────────────────────────────────────────────────

TAMIL_KEYWORDS: Dict[str, List[str]] = {
    "ஜ்வரம்": ["fever", "jwara"],
    "இரத்த சர்க்கரை": ["diabetes", "sugar", "glucose"],
    "மூட்டு வலி": ["joint pain", "arthritis"],
    "இருமல்": ["cough", "bronchitis"],
    "மூச்சு திணறல்": ["breathlessness", "asthma"],
    "சோர்வு": ["fatigue", "weakness"],
    "தலைவலி": ["headache"],
    "மஞ்சள் காமாலை": ["jaundice"],
    "வயிற்று வலி": ["abdominal pain"],
    "பிரமேகம்": ["diabetes", "prameha"],
    "ஆமவாதம்": ["arthritis", "amavata"],
}


def normalize_tamil(text: str) -> str:
    """Convert Tamil keywords to English equivalents for processing."""
    result = text
    for tamil_word, english_words in TAMIL_KEYWORDS.items():
        if tamil_word in result:
            result = result.replace(tamil_word, " ".join(english_words))
    return result


class MLService:
    """Production ML service for TulsiHealth."""

    async def extract_symptoms_from_text(
        self, text: str, db: Optional[AsyncSession] = None, language: str = "en"
    ) -> List[Dict[str, Any]]:
        """
        NLP symptom extraction — maps free text to NAMASTE codes.
        If db is provided, queries the NamasteCode table. Falls back to knowledge base.
        """
        if language == "ta":
            text = normalize_tamil(text)

        text_lower = text.lower()
        results = []

        # If DB is provided, search there
        if db:
            try:
                # Search for codes where symptoms contain any word from the text or name matches
                # In production, use full-text search index (e.g., SQLite FTS5)
                # Here we do a broad fetch and filter for simplicity in SQLite
                result = await db.execute(select(NamasteCode))
                db_codes = result.scalars().all()
                
                for code_obj in db_codes:
                    score = 0.0
                    matched_keywords = []
                    
                    # Search in name
                    if code_obj.name_en.lower() in text_lower:
                        score += 3.0
                    
                    # Search in symptoms (JSON list)
                    if code_obj.symptoms:
                        for s in code_obj.symptoms:
                            if s.lower() in text_lower:
                                score += 1.0
                                matched_keywords.append(s)
                    
                    # Search in native names
                    if code_obj.name_ta and code_obj.name_ta in text:
                        score += 3.0
                    
                    # Direct code match
                    if code_obj.code.lower() in text_lower:
                        score += 5.0

                    if score > 0:
                        confidence = min(score / 6.0, 1.0)
                        results.append({
                            "namaste_code": code_obj.code,
                            "namaste_name": code_obj.name_en,
                            "icd11_code": code_obj.icd11_mms_code,
                            "tm2_code": code_obj.tm2_code,
                            "tamil_name": code_obj.name_ta or "",
                            "confidence": round(confidence, 3),
                            "matched_keywords": matched_keywords,
                            "category": code_obj.category or "General",
                        })
                
                results.sort(key=lambda x: x["confidence"], reverse=True)
                if results:
                    return results[:10]
            except Exception as e:
                logger.error(f"DB search for symptoms failed: {e}")

        # Fallback to hardcoded knowledge base
        for entry in NAMASTE_KNOWLEDGE_BASE:
            score = 0.0
            matched_keywords = []

            for keyword in entry["keywords"]:
                if keyword in text_lower:
                    score += 1.0
                    matched_keywords.append(keyword)

            for symptom in entry["symptoms"]:
                for word in symptom.split():
                    if word in text_lower and len(word) > 3:
                        score += 0.5

            if entry["namaste_code"].lower() in text_lower:
                score += 5.0

            if score > 0:
                confidence = min(score / 6.0, 1.0)
                results.append({
                    "namaste_code": entry["namaste_code"],
                    "namaste_name": entry["name"],
                    "icd11_code": entry["icd11"],
                    "icd11_name": entry["name"],
                    "tm2_code": entry["tm2"],
                    "tamil_name": entry.get("tamil", ""),
                    "confidence": round(confidence, 3),
                    "matched_keywords": matched_keywords,
                    "category": entry["category"],
                })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:10]

    def predict_recovery_risk(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        ML recovery risk prediction.
        Considers age, conditions, severity, medications, and special flags.
        """
        age = int(patient_data.get("age", 30))
        conditions = patient_data.get("chronic_conditions", [])
        severity = patient_data.get("severity", "mild")
        medications = patient_data.get("current_medications", [])

        # Special flags
        is_pregnant = patient_data.get("is_pregnant", False)
        has_heart_surgery = patient_data.get("has_heart_surgery", False)
        has_diabetes = patient_data.get("has_diabetes", False)

        # Base risk calculation
        risk_score = 0.0

        # Age factor
        if age < 18:
            risk_score += 0.10
        elif age < 40:
            risk_score += 0.05
        elif age < 60:
            risk_score += 0.20
        elif age < 75:
            risk_score += 0.35
        else:
            risk_score += 0.50

        # Severity factor
        sev_map = {"mild": 0.10, "moderate": 0.25, "severe": 0.45}
        risk_score += sev_map.get(severity, 0.25)

        # Condition count factor
        risk_score += min(len(conditions) * 0.08, 0.30)

        # Special risk factors
        if is_pregnant:
            risk_score += 0.15
        if has_heart_surgery:
            risk_score += 0.20
        if has_diabetes:
            risk_score += 0.12

        # Medication benefit (treatment reduces risk)
        if medications:
            risk_score -= min(len(medications) * 0.03, 0.10)

        # Clamp
        risk_score = max(0.05, min(risk_score, 0.95))

        # Risk level
        if risk_score < 0.30:
            risk_level = "low"
        elif risk_score < 0.55:
            risk_level = "moderate"
        elif risk_score < 0.75:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Recovery probability
        recovery_prob = round((1.0 - risk_score) * 100, 1)

        # Recommendations
        recommendations = self._build_recommendations(
            risk_level, age, conditions, is_pregnant, has_heart_surgery, has_diabetes
        )

        return {
            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "confidence": round(0.75 + (0.15 * (1 - abs(risk_score - 0.5) * 2)), 3),
            "recovery_probability": recovery_prob,
            "factors": {
                "age_risk": round(min(age / 100, 0.5), 3),
                "severity_risk": sev_map.get(severity, 0.25),
                "condition_count": len(conditions),
                "special_flags": {
                    "pregnant": is_pregnant,
                    "heart_surgery": has_heart_surgery,
                    "diabetes": has_diabetes,
                },
            },
            "recommendations": recommendations,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def _build_recommendations(
        self,
        risk_level: str,
        age: int,
        conditions: List[str],
        pregnant: bool,
        heart: bool,
        diabetes: bool,
    ) -> List[str]:
        recs = []
        if risk_level in ("high", "critical"):
            recs.append("Immediate specialist consultation recommended")
            recs.append("Consider hospital admission for monitoring")
        if pregnant:
            recs.append("Avoid Sudarshana Churna and Triphala during pregnancy")
            recs.append("Consult Gyne-AYUSH specialist before any herbal treatment")
        if heart:
            recs.append("Cardiac clearance required before Panchakarma therapies")
            recs.append("Avoid Virechana and Basti without cardiologist approval")
        if diabetes:
            recs.append("Monitor blood glucose during AYUSH treatment")
            recs.append("Karela juice may enhance hypoglycaemic effect of insulin")
        if age > 65:
            recs.append("Start with half doses for herbal formulations")
            recs.append("Geriatric AYUSH assessment recommended")
        recs.append("Follow-up in 2 weeks to assess treatment response")
        recs.append("All herbal medicines must be taken under physician supervision")
        return recs

    def recommend_ayush_medicines(
        self, patient_profile: Dict[str, Any], conditions: List[str]
    ) -> List[Dict[str, Any]]:
        """
        AYUSH medicine recommendation based on condition list.
        Returns assistive suggestions only — never prescriptions.
        """
        results = []
        is_pregnant = patient_profile.get("is_pregnant", False)
        has_heart = patient_profile.get("has_heart_surgery", False)
        age = patient_profile.get("age", 30)

        for condition in conditions:
            cond_lower = condition.lower()
            for entry in NAMASTE_KNOWLEDGE_BASE:
                # Match by code or name
                if (
                    entry["namaste_code"].lower() == cond_lower
                    or entry["name"].lower() == cond_lower
                    or any(k in cond_lower for k in entry["keywords"])
                ):
                    # Filter contraindicated medicines
                    safe_medicines = []
                    for med in entry["medicines"]:
                        skip = False
                        if is_pregnant and "pregnancy" in entry.get("contraindications", []):
                            skip = True
                        if has_heart and "heart_surgery" in entry.get("contraindications", []):
                            skip = True
                        if not skip:
                            m = med.copy()
                            if age > 65:
                                m["note"] = "Reduce dose by 50% for elderly"
                            safe_medicines.append(m)

                    if safe_medicines:
                        results.append({
                            "condition": condition,
                            "namaste_code": entry["namaste_code"],
                            "icd11": entry["icd11"],
                            "medicines": safe_medicines,
                            "category": entry["category"],
                        })
                    break

        return results

    def search_terminology(
        self, query: str, language: str = "en", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        In-memory NAMASTE/ICD-11 terminology search.
        Used as fallback when DB is unavailable.
        """
        if language == "ta":
            query = normalize_tamil(query)

        query_lower = query.lower()
        results = []

        for entry in NAMASTE_KNOWLEDGE_BASE:
            score = 0.0

            if query_lower in entry["name"].lower():
                score += 3.0
            if query_lower in entry["namaste_code"].lower():
                score += 5.0
            if query_lower in entry["icd11"].lower():
                score += 5.0
            if query_lower in entry.get("tamil", ""):
                score += 3.0
            for kw in entry["keywords"]:
                if query_lower in kw or kw in query_lower:
                    score += 1.0

            if score > 0:
                results.append({
                    "namaste_code": entry["namaste_code"],
                    "namaste_name": entry["name"],
                    "icd11_code": entry["icd11"],
                    "icd11_name": f"ICD-11: {entry['icd11']}",
                    "tm2_code": entry["tm2"],
                    "tm2_name": f"TM2: {entry['tm2']}",
                    "confidence": min(score / 8.0, 1.0),
                    "category": entry["category"],
                    "tamil_name": entry.get("tamil", ""),
                })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:limit]


# ── Blockchain Audit Chain ────────────────────────────────────────────────────

class BlockchainAuditChain:
    """
    Simple SHA-256 blockchain for tamper-evident audit logs.
    Each block links to the previous block's hash.
    """

    def __init__(self):
        self._chain: List[Dict[str, Any]] = []
        # Genesis block
        self._add_block(
            data={"event": "GENESIS", "system": "TulsiHealth", "version": "1.0.0"},
            previous_hash="0" * 64,
        )

    def _compute_hash(self, block: Dict[str, Any]) -> str:
        block_string = json.dumps(block, sort_keys=True, default=str)
        return hashlib.sha256(block_string.encode()).hexdigest()

    def _add_block(self, data: Dict[str, Any], previous_hash: str) -> Dict[str, Any]:
        block = {
            "index": len(self._chain),
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
            "previous_hash": previous_hash,
            "nonce": len(self._chain),
        }
        block["hash"] = self._compute_hash(block)
        self._chain.append(block)
        return block

    def add_audit_event(
        self,
        action: str,
        resource: str,
        resource_id: str,
        user_id: str,
        outcome: str = "success",
        details: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Add an audit event as a new block."""
        data = {
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "user_id": user_id,
            "outcome": outcome,
            "details": details or {},
        }
        previous_hash = self._chain[-1]["hash"] if self._chain else "0" * 64
        return self._add_block(data, previous_hash)

    def get_chain(self) -> List[Dict[str, Any]]:
        return self._chain

    def verify_integrity(self) -> bool:
        """Verify the chain has not been tampered with."""
        for i in range(1, len(self._chain)):
            current = self._chain[i]
            previous = self._chain[i - 1]

            # Check previous hash link
            if current["previous_hash"] != previous["hash"]:
                logger.error(f"Chain broken at block {i}: previous_hash mismatch")
                return False

            # Recompute and verify current hash
            stored_hash = current.pop("hash")
            recomputed = self._compute_hash(current)
            current["hash"] = stored_hash

            if stored_hash != recomputed:
                logger.error(f"Chain tampered at block {i}: hash mismatch")
                return False

        return True

    def get_last_block(self) -> Optional[Dict[str, Any]]:
        return self._chain[-1] if self._chain else None


# ── Singletons ────────────────────────────────────────────────────────────────

ml_service = MLService()
audit_chain = BlockchainAuditChain()
