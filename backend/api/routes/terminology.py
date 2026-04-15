"""
TulsiHealth — Terminology Search & Translate Routes (Production)
Serves NAMASTE ↔ TM2 ↔ ICD-11 ConceptMap with auto-complete search
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Embedded NAMASTE Knowledge Base (no external DB required) ─────────────────

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {"namaste_code": "AYU-D-0001", "namaste_name": "Vataja Jwara",  "icd11_code": "1D01",  "icd11_name": "Fever of unknown origin",        "tm2_code": "TM2-001", "tm2_name": "Fever NOS (TM)",             "category": "Jwara (Fever)",           "tamil_name": "வாதஜ ஜ்வரம்",    "confidence": 0.94, "keywords": ["fever", "jwara", "temp", "chills", "vata"]},
    {"namaste_code": "AYU-D-0002", "namaste_name": "Pittaja Jwara", "icd11_code": "1D01",  "icd11_name": "Fever of unknown origin",        "tm2_code": "TM2-002", "tm2_name": "Fever — Heat Type",          "category": "Jwara (Fever)",           "tamil_name": "பித்தஜ ஜ்வரம்",   "confidence": 0.91, "keywords": ["fever", "pitta", "burning", "high temperature"]},
    {"namaste_code": "AYU-D-0201", "namaste_name": "Prameha",       "icd11_code": "5A11",  "icd11_name": "Type 2 Diabetes Mellitus",        "tm2_code": "TM2-201", "tm2_name": "Diabetes Mellitus (TM)",     "category": "Prameha (Diabetes)",      "tamil_name": "பிரமேகம்",        "confidence": 0.91, "keywords": ["diabetes", "prameha", "sugar", "glucose", "urine", "thirst"]},
    {"namaste_code": "AYU-D-0301", "namaste_name": "Amavata",       "icd11_code": "FA20",  "icd11_name": "Rheumatoid Arthritis",           "tm2_code": "TM2-301", "tm2_name": "Bi Syndrome Wind-Cold",      "category": "Vata Disorders",          "tamil_name": "ஆமவாதம்",         "confidence": 0.88, "keywords": ["arthritis", "amavata", "joint", "pain", "swelling", "rheumatoid"]},
    {"namaste_code": "AYU-D-0401", "namaste_name": "Arsha",         "icd11_code": "DB33",  "icd11_name": "Haemorrhoids",                   "tm2_code": "TM2-401", "tm2_name": "Intestinal Qi Stagnation",   "category": "Ano-rectal Disorders",    "tamil_name": "அர்சஸ்",          "confidence": 0.82, "keywords": ["piles", "hemorrhoids", "arsha", "rectal", "bleeding"]},
    {"namaste_code": "AYU-D-0102", "namaste_name": "Kaphaja Kasa",  "icd11_code": "CA23",  "icd11_name": "Acute Bronchitis",               "tm2_code": "TM2-102", "tm2_name": "Lung Phlegm-Damp Cough",    "category": "Kasa (Cough)",            "tamil_name": "கபஜ காசம்",       "confidence": 0.87, "keywords": ["cough", "kasa", "bronchitis", "phlegm", "mucus"]},
    {"namaste_code": "AYU-D-0602", "namaste_name": "Shwasa",        "icd11_code": "CA22",  "icd11_name": "Bronchial Asthma",               "tm2_code": "TM2-602", "tm2_name": "Lung Qi Deficiency",         "category": "Shwasa (Asthma)",         "tamil_name": "ஸ்வாஸ ரோகம்",    "confidence": 0.85, "keywords": ["asthma", "shwasa", "breathlessness", "wheezing"]},
    {"namaste_code": "AYU-D-0701", "namaste_name": "Pandu",         "icd11_code": "3A00",  "icd11_name": "Iron Deficiency Anaemia",        "tm2_code": "TM2-701", "tm2_name": "Blood Deficiency (TM)",      "category": "Pandu (Anaemia)",         "tamil_name": "பாண்டு ரோகம்",    "confidence": 0.80, "keywords": ["anaemia", "pandu", "pallor", "weakness", "iron"]},
    {"namaste_code": "AYU-D-0801", "namaste_name": "Grahani",       "icd11_code": "DA91",  "icd11_name": "Irritable Bowel Syndrome",       "tm2_code": "TM2-801", "tm2_name": "Spleen-Stomach Disharmony", "category": "Grahani (GI)",            "tamil_name": "கிரஹணி",          "confidence": 0.78, "keywords": ["ibs", "diarrhea", "constipation", "grahani", "bowel"]},
    {"namaste_code": "AYU-D-0901", "namaste_name": "Kamala",        "icd11_code": "DC21",  "icd11_name": "Jaundice",                       "tm2_code": "TM2-901", "tm2_name": "Liver Damp-Heat (TM)",       "category": "Liver Disorders",         "tamil_name": "மஞ்சள் காமாலை",  "confidence": 0.85, "keywords": ["jaundice", "kamala", "liver", "yellow", "bilirubin"]},
    {"namaste_code": "AYU-D-1001", "namaste_name": "Shotha",        "icd11_code": "ME41",  "icd11_name": "Oedema",                         "tm2_code": "TM2-1001","tm2_name": "Water Retention (TM)",       "category": "Shotha (Oedema)",         "tamil_name": "சோதம்",           "confidence": 0.75, "keywords": ["edema", "swelling", "oedema", "water retention", "shotha"]},
    {"namaste_code": "AYU-D-1101", "namaste_name": "Gridhrasi",     "icd11_code": "ME84",  "icd11_name": "Sciatica",                       "tm2_code": "TM2-1101","tm2_name": "Kidney Yang Deficiency",     "category": "Vata Disorders",          "tamil_name": "கிரித்ராசி",      "confidence": 0.82, "keywords": ["sciatica", "gridhrasi", "leg pain", "nerve pain", "lumbar"]},
    {"namaste_code": "AYU-D-1201", "namaste_name": "Mutrakrichra",  "icd11_code": "GC00",  "icd11_name": "Urinary Tract Infection",        "tm2_code": "TM2-1201","tm2_name": "Bladder Damp-Heat",          "category": "Mutravahasrotas",         "tamil_name": "மூத்திர கிருச்சிரம்","confidence": 0.80, "keywords": ["uti", "urinary", "burning urination", "mutrakrichra", "dysuria"]},
    {"namaste_code": "AYU-D-1301", "namaste_name": "Shiroroga",     "icd11_code": "8A85",  "icd11_name": "Migraine",                       "tm2_code": "TM2-1301","tm2_name": "Liver Yang Rising",          "category": "Shiro Rogas",             "tamil_name": "தலைவலி",          "confidence": 0.78, "keywords": ["migraine", "headache", "shiroroga", "head pain"]},
    {"namaste_code": "AYU-D-1401", "namaste_name": "Tvak Rogas",    "icd11_code": "EA90",  "icd11_name": "Eczema / Atopic Dermatitis",     "tm2_code": "TM2-1401","tm2_name": "Blood Heat Skin Disorder",   "category": "Skin Disorders",          "tamil_name": "தோல் நோய்",       "confidence": 0.76, "keywords": ["eczema", "skin", "rash", "dermatitis", "tvak", "itching"]},
]

# Tamil → English normalization map
TAMIL_MAP: Dict[str, str] = {
    "ஜ்வரம்": "fever", "பிரமேகம்": "diabetes", "ஆமவாதம்": "arthritis",
    "காசம்": "cough", "ஸ்வாஸ": "asthma", "பாண்டு": "anaemia",
    "சோர்வு": "fatigue", "தலைவலி": "headache", "மஞ்சள் காமாலை": "jaundice",
    "மூட்டு வலி": "joint pain", "மூச்சு திணறல்": "breathlessness",
}

CONCEPT_MAP = {
    entry["namaste_code"]: {
        "icd11": entry["icd11_code"],
        "tm2": entry["tm2_code"],
        "name": entry["namaste_name"],
    }
    for entry in KNOWLEDGE_BASE
}


def _normalize(text: str) -> str:
    for tamil, eng in TAMIL_MAP.items():
        text = text.replace(tamil, eng)
    return text.lower().strip()


def _score(entry: Dict[str, Any], q: str) -> float:
    score = 0.0
    q = q.lower()
    if q in entry["namaste_name"].lower():
        score += 4.0
    if q in entry["namaste_code"].lower():
        score += 5.0
    if q in entry["icd11_code"].lower():
        score += 5.0
    if q in entry["tm2_code"].lower():
        score += 4.0
    if q in entry.get("tamil_name", ""):
        score += 3.0
    for kw in entry.get("keywords", []):
        if q in kw or kw in q:
            score += 1.0
    if q in entry.get("icd11_name", "").lower():
        score += 2.0
    return score


# ── Request / Response Models ─────────────────────────────────────────────────

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    query: str
    language: str


class TranslateResponse(BaseModel):
    source_code: str
    source_system: str
    target_system: str
    target_code: Optional[str]
    target_name: Optional[str]
    confidence: float
    found: bool


class ConceptMapResponse(BaseModel):
    total_mappings: int
    mappings: List[Dict[str, Any]]
    systems: List[str]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/search", response_model=SearchResponse)
async def search_terminology(
    q: str = Query("", description="Search query (disease name, code, symptom)"),
    lang: str = Query("en", description="Language: en or ta"),
    limit: int = Query(10, ge=1, le=50),
    system: str = Query("all", description="Filter: all | namaste | icd11 | tm2"),
):
    """
    Auto-complete search across NAMASTE, TM2, and ICD-11 terminologies.
    Supports English and Tamil queries.
    """
    normalized_q = _normalize(q) if q else ""
    results = []

    for entry in KNOWLEDGE_BASE:
        if not normalized_q:
            results.append({**entry, "score": entry["confidence"]})
            continue

        score = _score(entry, normalized_q)
        if score > 0:
            result = {**entry, "score": round(score / 8.0, 3)}

            # System filter
            if system == "namaste" and not entry.get("namaste_code"):
                continue
            if system == "icd11" and not entry.get("icd11_code"):
                continue
            if system == "tm2" and not entry.get("tm2_code"):
                continue

            results.append(result)

    results.sort(key=lambda x: x.get("score", 0), reverse=True)
    results = results[:limit]

    return SearchResponse(
        results=results,
        total=len(results),
        query=q,
        language=lang,
    )


@router.get("/translate", response_model=TranslateResponse)
async def translate_code(
    code: str = Query(..., description="Source code to translate"),
    from_sys: str = Query("namaste", description="Source system: namaste | icd11 | tm2"),
    to_sys: str = Query("icd11", description="Target system: namaste | icd11 | tm2"),
):
    """
    Translate a code from one terminology system to another.
    Implements FHIR ConceptMap lookup.
    """
    code_upper = code.upper()

    for entry in KNOWLEDGE_BASE:
        matched = False
        if from_sys == "namaste" and entry["namaste_code"] == code_upper:
            matched = True
        elif from_sys == "icd11" and entry["icd11_code"] == code_upper:
            matched = True
        elif from_sys == "tm2" and entry["tm2_code"] == code_upper:
            matched = True

        if matched:
            if to_sys == "icd11":
                return TranslateResponse(
                    source_code=code, source_system=from_sys,
                    target_system=to_sys, target_code=entry["icd11_code"],
                    target_name=entry["icd11_name"], confidence=0.90, found=True,
                )
            elif to_sys == "tm2":
                return TranslateResponse(
                    source_code=code, source_system=from_sys,
                    target_system=to_sys, target_code=entry["tm2_code"],
                    target_name=entry["tm2_name"], confidence=0.88, found=True,
                )
            elif to_sys == "namaste":
                return TranslateResponse(
                    source_code=code, source_system=from_sys,
                    target_system=to_sys, target_code=entry["namaste_code"],
                    target_name=entry["namaste_name"], confidence=0.90, found=True,
                )

    return TranslateResponse(
        source_code=code, source_system=from_sys,
        target_system=to_sys, target_code=None,
        target_name=None, confidence=0.0, found=False,
    )


@router.get("/concept-map", response_model=ConceptMapResponse)
async def get_concept_map():
    """Return the full FHIR-style ConceptMap for NAMASTE ↔ TM2 ↔ ICD-11."""
    mappings = [
        {
            "namaste_code": e["namaste_code"],
            "namaste_name": e["namaste_name"],
            "tm2_code": e["tm2_code"],
            "tm2_name": e["tm2_name"],
            "icd11_code": e["icd11_code"],
            "icd11_name": e["icd11_name"],
            "category": e["category"],
            "tamil_name": e.get("tamil_name", ""),
            "confidence": e["confidence"],
        }
        for e in KNOWLEDGE_BASE
    ]
    return ConceptMapResponse(
        total_mappings=len(mappings),
        mappings=mappings,
        systems=["NAMASTE (AYUSH)", "ICD-11 TM2", "ICD-11 MMS"],
    )


@router.get("/namaste/{code}")
async def get_namaste_code(code: str):
    """Get full details for a specific NAMASTE code."""
    code_upper = code.upper()
    for entry in KNOWLEDGE_BASE:
        if entry["namaste_code"] == code_upper:
            return entry
    raise HTTPException(status_code=404, detail=f"NAMASTE code {code} not found")


@router.get("/icd11/{code}")
async def get_icd11_code(code: str):
    """Get all NAMASTE mappings for an ICD-11 code."""
    code_upper = code.upper()
    results = [e for e in KNOWLEDGE_BASE if e["icd11_code"] == code_upper]
    if not results:
        raise HTTPException(status_code=404, detail=f"ICD-11 code {code} not found")
    return {"code": code_upper, "mappings": results}


@router.get("/categories")
async def list_categories():
    """List all terminology categories."""
    cats = list({e["category"] for e in KNOWLEDGE_BASE})
    return {"categories": sorted(cats), "total": len(cats)}


@router.get("/stats")
async def terminology_stats():
    """Terminology service statistics."""
    return {
        "total_namaste_codes": len(KNOWLEDGE_BASE),
        "total_icd11_codes": len({e["icd11_code"] for e in KNOWLEDGE_BASE}),
        "total_tm2_codes": len({e["tm2_code"] for e in KNOWLEDGE_BASE}),
        "total_mappings": len(KNOWLEDGE_BASE),
        "systems": ["NAMASTE AYUSH", "WHO ICD-11 TM2", "WHO ICD-11 MMS"],
        "languages": ["English", "Tamil"],
        "status": "operational",
    }
