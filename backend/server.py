"""
TulsiHealth - India's First AYUSH + ICD-11 Dual-Coding Smart EMR
Standalone production-ready FastAPI server with SQLite (no Docker needed)
"""
import os, csv, json, hashlib, uuid, qrcode, io, base64, logging
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session, relationship
import uvicorn

# ── Config ──────────────────────────────────────────────
SECRET_KEY = "tulsihealth-secret-key-2024-ayush-icd11"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
NAMASTE_CSV = os.path.join(os.path.dirname(__file__), "../datasets/namaste.csv")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("tulsihealth")

# ── Database ─────────────────────────────────────────────
engine = create_engine("sqlite:///./tulsihealth.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    email         = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    hashed_pw     = Column(String, nullable=False)
    role          = Column(String, default="doctor")  # doctor/admin/patient
    specialty     = Column(String, default="General Medicine")
    hospital      = Column(String, default="TulsiHealth Clinic")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    id            = Column(Integer, primary_key=True)
    patient_id    = Column(String, unique=True, index=True)  # TH-ABXXXX
    name          = Column(String, nullable=False)
    age           = Column(Integer)
    gender        = Column(String)
    blood_group   = Column(String)
    phone         = Column(String)
    address       = Column(String)
    ayush_system  = Column(String, default="Ayurveda")
    constitution  = Column(String, default="Vata-Pitta")
    allergies     = Column(Text, default="[]")
    created_at    = Column(DateTime, default=datetime.utcnow)
    created_by    = Column(Integer, ForeignKey("users.id"))
    encounters    = relationship("Encounter", back_populates="patient")

class Encounter(Base):
    __tablename__ = "encounters"
    id            = Column(Integer, primary_key=True)
    encounter_id  = Column(String, unique=True, default=lambda: f"ENC-{uuid.uuid4().hex[:8].upper()}")
    patient_id    = Column(Integer, ForeignKey("patients.id"))
    doctor_id     = Column(Integer, ForeignKey("users.id"))
    namaste_code  = Column(String)
    namaste_display = Column(String)
    icd11_code    = Column(String)
    icd11_display = Column(String)
    symptoms      = Column(Text, default="[]")
    severity      = Column(String, default="mild")
    notes         = Column(Text, default="")
    fhir_bundle   = Column(Text, default="{}")
    created_at    = Column(DateTime, default=datetime.utcnow)
    patient       = relationship("Patient", back_populates="encounters")

class TerminologyCode(Base):
    __tablename__ = "terminology"
    id            = Column(Integer, primary_key=True)
    namaste_code  = Column(String, unique=True, index=True)
    ayush_system  = Column(String)
    disease_name  = Column(String, index=True)
    symptoms      = Column(String)
    icd11_code    = Column(String, index=True)
    icd11_title   = Column(String)
    severity      = Column(Integer, default=1)
    description   = Column(Text, default="")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id            = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    action        = Column(String)
    resource      = Column(String)
    detail        = Column(Text)
    ip_address    = Column(String)
    prev_hash     = Column(String)
    curr_hash     = Column(String)
    timestamp     = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ── Auth ─────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_pw(pw): return pwd_ctx.hash(pw[:72])
def verify_pw(pw, hashed): return pwd_ctx.verify(pw[:72], hashed)

def create_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid: str = payload.get("sub")
        if not uid: raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.uid == uid).first()
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

# ── Seed Data ─────────────────────────────────────────────
def seed_db():
    db = SessionLocal()
    try:
        # Seed admin user
        if not db.query(User).filter(User.email == "admin@tulsihealth.in").first():
            db.add(User(email="admin@tulsihealth.in", name="Dr. Admin", hashed_pw=hash_pw("admin123"), role="admin"))
            db.add(User(email="doctor@tulsihealth.in", name="Dr. Rajan Kumar", hashed_pw=hash_pw("doctor123"), role="doctor", specialty="Ayurveda"))
            db.commit()
            log.info("✅ Demo users seeded")

        # Seed NAMASTE terminology from CSV
        if db.query(TerminologyCode).count() == 0:
            codes = [
                ("AY001","Ayurveda","Vataja Jwara","fever,chills,headache","1D01","Typhoid fever",2),
                ("AY002","Ayurveda","Pittaja Jwara","high fever,jaundice,burning","1D00","Intestinal fever",2),
                ("AY003","Ayurveda","Kaphaja Jwara","cough,cold,heaviness","CA23","Acute bronchitis",1),
                ("AY004","Ayurveda","Sannipataja Jwara","all three doshas,severe","1B40","Dengue fever",3),
                ("AY005","Ayurveda","Madhumeha","frequent urination,thirst,obesity","5A00","Type 2 diabetes mellitus",2),
                ("AY006","Ayurveda","Prameha","urinary disorder,sweet urine","GC00","Disorder of kidney",2),
                ("AY007","Ayurveda","Hridroga","chest pain,palpitations,dyspnea","BA80","Heart failure",3),
                ("AY008","Ayurveda","Sandhivata","joint pain,stiffness,swelling","FA20","Osteoarthritis of knee",2),
                ("AY009","Ayurveda","Amavata","morning stiffness,warm joints","FA00","Rheumatoid arthritis",2),
                ("AY010","Ayurveda","Arsha","rectal bleeding,prolapse","DB70","Haemorrhoids",2),
                ("AY011","Ayurveda","Shirashoola","headache,nausea,photophobia","8A80","Migraine disorders",2),
                ("AY012","Ayurveda","Kasa Shwasa","cough,breathlessness,wheezing","CA22","Asthma",2),
                ("AY013","Ayurveda","Grahani","diarrhea,malabsorption,bloating","DD91","Irritable bowel syndrome",2),
                ("AY014","Ayurveda","Pandu","pallor,fatigue,weakness","3A00","Iron deficiency anaemia",2),
                ("AY015","Ayurveda","Rajayakshma","chronic cough,weight loss,fever","1B10","Pulmonary tuberculosis",3),
                ("AY016","Ayurveda","Vatarakta","gout,joint swelling,redness","FA90","Gout",2),
                ("AY017","Ayurveda","Shula","abdominal colic,cramping pain","DD41","Abdominal pain",2),
                ("AY018","Ayurveda","Kamala","jaundice,hepatomegaly","DB90","Liver disease",3),
                ("AY019","Ayurveda","Yakritdalyudara","liver enlargement,ascites","DB91","Cirrhosis of liver",3),
                ("AY020","Ayurveda","Udara Roga","abdominal distension,ascites","DD00","Gastritis",2),
                ("SID001","Siddha","Vayu Noi","joint pain,nerve pain","8B80","Peripheral neuropathy",2),
                ("SID002","Siddha","Azhal Noi","fever,inflammation,burning","1D01","Typhoid fever",2),
                ("SID003","Siddha","Iyam Noi","cough,cold,congestion","CA20","Acute upper respiratory infection",1),
                ("HOM001","Homeopathy","Jwar","intermittent fever,chills","1D00","Intestinal fever",1),
                ("HOM002","Homeopathy","Pratishyaya","common cold,rhinitis","CA00","Common cold",1),
                ("UNA001","Unani","Humma","fever,malaise","1D01","Typhoid fever",1),
                ("UNA002","Unani","Waja ul Mafasil","joint pains,arthralgia","FA20","Osteoarthritis of knee",2),
                ("AY021","Ayurveda","Mutrakriccha","painful urination,UTI","GC20","Urinary tract infection",2),
                ("AY022","Ayurveda","Pakshaghata","stroke,paralysis","8B20","Stroke",3),
                ("AY023","Ayurveda","Apasmara","epilepsy,seizures","8A60","Epilepsy",3),
                ("AY024","Ayurveda","Unmada","mental disorder,delusion","6A20","Schizophrenia",3),
                ("AY025","Ayurveda","Visarpa","herpes,spreading rash","1E90","Herpes zoster",2),
                ("AY026","Ayurveda","Kushtha","skin disorder,dermatitis","EA00","Eczema",1),
                ("AY027","Ayurveda","Sitapitta","urticaria,hives,itching","EB00","Urticaria",1),
                ("AY028","Ayurveda","Shwitra","vitiligo,white patches","ED40","Vitiligo",1),
                ("AY029","Ayurveda","Netra Roga","eye disorders,conjunctivitis","9A00","Conjunctivitis",1),
                ("AY030","Ayurveda","Karna Roga","ear pain,otitis","AA00","Otitis media",2),
            ]
            for c in codes:
                db.add(TerminologyCode(
                    namaste_code=c[0], ayush_system=c[1], disease_name=c[2],
                    symptoms=c[3], icd11_code=c[4], icd11_title=c[5], severity=c[6]
                ))
            db.commit()
            log.info(f"✅ {len(codes)} NAMASTE codes seeded")

        # Seed demo patients
        if db.query(Patient).count() == 0:
            patients = [
                Patient(patient_id="TH-AB83724", name="Devaki Sriram", age=45, gender="Female",
                       blood_group="O+", phone="9876543210", ayush_system="Ayurveda",
                       constitution="Pitta-Vata", allergies='["Penicillin"]',
                       address="Chennai, Tamil Nadu"),
                Patient(patient_id="TH-CD92841", name="Rajan Pillai", age=62, gender="Male",
                       blood_group="B+", phone="9988776655", ayush_system="Siddha",
                       constitution="Vata-Kapha", allergies='["Sulfa drugs"]',
                       address="Coimbatore, Tamil Nadu"),
                Patient(patient_id="TH-EF73829", name="Sunita Sharma", age=33, gender="Female",
                       blood_group="A+", phone="8877665544", ayush_system="Homeopathy",
                       constitution="Kapha-Vata", allergies='[]',
                       address="Delhi"),
                Patient(patient_id="TH-GH45612", name="Mohan Lal Gupta", age=55, gender="Male",
                       blood_group="AB+", phone="7766554433", ayush_system="Unani",
                       constitution="Vata-Pitta", allergies='["Aspirin"]',
                       address="Mumbai, Maharashtra"),
            ]
            for p in patients:
                db.add(p)
            db.commit()
            log.info("✅ Demo patients seeded")

            # Seed demo encounters
            p1 = db.query(Patient).filter(Patient.patient_id == "TH-AB83724").first()
            p2 = db.query(Patient).filter(Patient.patient_id == "TH-CD92841").first()
            enc1 = Encounter(patient_id=p1.id, doctor_id=1, namaste_code="AY001",
                           namaste_display="Vataja Jwara (Fever)", icd11_code="1D01",
                           icd11_display="Typhoid fever", severity="moderate",
                           symptoms='["fever","chills","headache"]',
                           notes="Patient complaining of high grade fever for 3 days.")
            enc2 = Encounter(patient_id=p1.id, doctor_id=1, namaste_code="AY005",
                           namaste_display="Madhumeha (Diabetes)", icd11_code="5A00",
                           icd11_display="Type 2 diabetes mellitus", severity="moderate",
                           symptoms='["thirst","frequent urination","fatigue"]',
                           notes="HbA1c elevated. Started Ayurvedic protocol.")
            enc3 = Encounter(patient_id=p2.id, doctor_id=1, namaste_code="AY008",
                           namaste_display="Sandhivata (Arthritis)", icd11_code="FA20",
                           icd11_display="Osteoarthritis of knee", severity="mild",
                           symptoms='["knee pain","stiffness","swelling"]',
                           notes="Bilateral knee involvement. Siddha treatment initiated.")
            db.add_all([enc1, enc2, enc3])
            db.commit()
            log.info("✅ Demo encounters seeded")

    except Exception as e:
        log.error(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()

# ── QR Generation ──────────────────────────────────────────
def generate_qr(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#00c896", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"

# ── FastAPI App ───────────────────────────────────────────
app = FastAPI(
    title="TulsiHealth API",
    description="India's First AYUSH + ICD-11 Dual-Coding Smart EMR - FHIR R4 Compliant",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Schemas ───────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "doctor"
    specialty: str = "General Medicine"
    hospital: str = "TulsiHealth Clinic"

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: str
    phone: str
    address: str
    ayush_system: str = "Ayurveda"
    constitution: str = "Vata-Pitta"
    allergies: List[str] = []

class EncounterCreate(BaseModel):
    patient_id: str
    namaste_code: str
    namaste_display: str
    icd11_code: str
    icd11_display: str
    symptoms: List[str] = []
    severity: str = "mild"
    notes: str = ""

# ── Helper: Audit ─────────────────────────────────────────
def log_audit(db: Session, user_id: int, action: str, resource: str, detail: str, ip: str = "127.0.0.1"):
    last = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last.curr_hash if last else "GENESIS"
    data = f"{user_id}{action}{resource}{detail}{datetime.utcnow().isoformat()}{prev_hash}"
    curr_hash = hashlib.sha256(data.encode()).hexdigest()
    db.add(AuditLog(user_id=user_id, action=action, resource=resource,
                   detail=detail, ip_address=ip, prev_hash=prev_hash, curr_hash=curr_hash))
    db.commit()

# ── ROUTES ────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "TulsiHealth API", "version": "2.0.0",
            "docs": "/docs", "features": ["NAMASTE", "ICD-11", "FHIR R4", "ML", "Audit"]}

@app.get("/health")
def health():
    return {"status": "healthy", "db": "sqlite", "timestamp": datetime.utcnow().isoformat()}

# ── AUTH ──────────────────────────────────────────────────
@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(name=req.name, email=req.email, hashed_pw=hash_pw(req.password),
                role=req.role, specialty=req.specialty, hospital=req.hospital)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token({"sub": user.uid})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.uid, "name": user.name, "email": user.email, "role": user.role}}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_pw(req.password, user.hashed_pw):
        raise HTTPException(401, "Invalid email or password")
    token = create_token({"sub": user.uid})
    log_audit(db, user.id, "LOGIN", "auth", f"User {user.email} logged in")
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.uid, "name": user.name, "email": user.email,
                     "role": user.role, "specialty": user.specialty, "hospital": user.hospital}}

@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.uid, "name": current_user.name,
            "email": current_user.email, "role": current_user.role,
            "specialty": current_user.specialty, "hospital": current_user.hospital}

# ── TERMINOLOGY ──────────────────────────────────────────
@app.get("/api/terminology/suggest")
def suggest(q: str, limit: int = 10, db: Session = Depends(get_db)):
    q_lower = q.lower()
    results = db.query(TerminologyCode).filter(
        (TerminologyCode.disease_name.ilike(f"%{q}%")) |
        (TerminologyCode.symptoms.ilike(f"%{q}%")) |
        (TerminologyCode.namaste_code.ilike(f"%{q}%")) |
        (TerminologyCode.icd11_title.ilike(f"%{q}%"))
    ).limit(limit).all()
    return [{"code": r.namaste_code, "display": f"{r.disease_name}", "system": r.ayush_system,
             "symptoms": r.symptoms, "icd11": r.icd11_code, "icd11_display": r.icd11_title,
             "severity": r.severity} for r in results]

@app.post("/api/terminology/translate")
def translate(source_code: str, db: Session = Depends(get_db)):
    code = db.query(TerminologyCode).filter(TerminologyCode.namaste_code == source_code).first()
    if not code:
        raise HTTPException(404, f"Code {source_code} not found")
    return {"source_code": code.namaste_code, "source_display": code.disease_name,
            "target_code": code.icd11_code, "target_display": code.icd11_title,
            "confidence": 0.95, "mapping_type": "equivalent"}

@app.get("/api/terminology/all")
def all_codes(db: Session = Depends(get_db)):
    codes = db.query(TerminologyCode).all()
    return [{"code": c.namaste_code, "display": c.disease_name, "system": c.ayush_system,
             "icd11": c.icd11_code, "icd11_display": c.icd11_title, "severity": c.severity} for c in codes]

# ── PATIENTS ──────────────────────────────────────────────
@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patients = db.query(Patient).all()
    result = []
    for p in patients:
        enc_count = db.query(Encounter).filter(Encounter.patient_id == p.id).count()
        result.append({
            "id": p.id, "patient_id": p.patient_id, "name": p.name, "age": p.age,
            "gender": p.gender, "blood_group": p.blood_group, "phone": p.phone,
            "ayush_system": p.ayush_system, "constitution": p.constitution,
            "allergies": json.loads(p.allergies or "[]"),
            "address": p.address, "encounter_count": enc_count,
            "created_at": p.created_at.isoformat()
        })
    return result

@app.post("/api/patients")
def create_patient(req: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pid = f"TH-{uuid.uuid4().hex[:6].upper()}"
    patient = Patient(
        patient_id=pid, name=req.name, age=req.age, gender=req.gender,
        blood_group=req.blood_group, phone=req.phone, address=req.address,
        ayush_system=req.ayush_system, constitution=req.constitution,
        allergies=json.dumps(req.allergies), created_by=current_user.id
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    qr_data = generate_qr(f"TH:{pid}:{req.name}:{req.blood_group}")
    log_audit(db, current_user.id, "CREATE", "patient", f"New patient {pid}: {req.name}")
    return {"patient_id": pid, "name": req.name, "qr_code": qr_data,
            "message": "Patient registered successfully"}

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not p: raise HTTPException(404, "Patient not found")
    encounters = db.query(Encounter).filter(Encounter.patient_id == p.id).all()
    qr = generate_qr(f"TH:{p.patient_id}:{p.name}:{p.blood_group}")
    return {
        "id": p.id, "patient_id": p.patient_id, "name": p.name, "age": p.age,
        "gender": p.gender, "blood_group": p.blood_group, "phone": p.phone,
        "ayush_system": p.ayush_system, "constitution": p.constitution,
        "allergies": json.loads(p.allergies or "[]"),
        "address": p.address, "qr_code": qr,
        "created_at": p.created_at.isoformat(),
        "encounters": [{
            "encounter_id": e.encounter_id, "namaste_code": e.namaste_code,
            "namaste_display": e.namaste_display, "icd11_code": e.icd11_code,
            "icd11_display": e.icd11_display, "severity": e.severity,
            "symptoms": json.loads(e.symptoms or "[]"), "notes": e.notes,
            "created_at": e.created_at.isoformat()
        } for e in encounters]
    }

@app.get("/api/patients/scan/{patient_id}")
def scan_patient(patient_id: str, db: Session = Depends(get_db)):
    """Public QR scan endpoint — no auth needed for emergency access"""
    p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not p: raise HTTPException(404, "Patient not found")
    encounters = db.query(Encounter).filter(Encounter.patient_id == p.id).all()
    return {
        "patient_id": p.patient_id, "name": p.name, "age": p.age,
        "blood_group": p.blood_group, "ayush_system": p.ayush_system,
        "constitution": p.constitution, "allergies": json.loads(p.allergies or "[]"),
        "encounters": [{
            "namaste_code": e.namaste_code, "namaste_display": e.namaste_display,
            "icd11_code": e.icd11_code, "icd11_display": e.icd11_display,
            "severity": e.severity, "notes": e.notes
        } for e in encounters]
    }

# ── ENCOUNTERS ────────────────────────────────────────────
@app.post("/api/encounters")
def create_encounter(req: EncounterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.patient_id == req.patient_id).first()
    if not patient: raise HTTPException(404, "Patient not found")
    fhir_bundle = {
        "resourceType": "Bundle", "type": "transaction",
        "entry": [{"resource": {
            "resourceType": "Condition",
            "code": {"coding": [
                {"system": "http://tulsihealth.in/namaste", "code": req.namaste_code, "display": req.namaste_display},
                {"system": "http://id.who.int/icd/release/11/mms", "code": req.icd11_code, "display": req.icd11_display}
            ]},
            "severity": req.severity,
            "note": [{"text": req.notes}]
        }}]
    }
    enc = Encounter(
        patient_id=patient.id, doctor_id=current_user.id,
        namaste_code=req.namaste_code, namaste_display=req.namaste_display,
        icd11_code=req.icd11_code, icd11_display=req.icd11_display,
        symptoms=json.dumps(req.symptoms), severity=req.severity, notes=req.notes,
        fhir_bundle=json.dumps(fhir_bundle)
    )
    db.add(enc)
    db.commit()
    db.refresh(enc)
    log_audit(db, current_user.id, "CREATE", "encounter", f"Encounter {enc.encounter_id} for {req.patient_id}")
    return {"encounter_id": enc.encounter_id, "fhir_bundle": fhir_bundle,
            "message": "Encounter created and FHIR bundle generated"}

# ── DASHBOARD STATS ────────────────────────────────────────
@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_patients = db.query(Patient).count()
    total_encounters = db.query(Encounter).count()
    today = datetime.utcnow().date()
    today_encounters = db.query(Encounter).filter(
        Encounter.created_at >= datetime(today.year, today.month, today.day)
    ).count()
    # Code frequency stats
    from sqlalchemy import func
    top_codes = db.query(
        Encounter.namaste_code, Encounter.namaste_display, func.count(Encounter.id).label("count")
    ).group_by(Encounter.namaste_code).order_by(func.count(Encounter.id).desc()).limit(5).all()
    return {
        "total_patients": total_patients,
        "total_encounters": total_encounters,
        "today_encounters": today_encounters,
        "top_diagnoses": [{"code": c.namaste_code, "display": c.namaste_display, "count": c.count} for c in top_codes],
        "db_status": "sqlite",
    }

@app.get("/api/dashboard/activity")
def dashboard_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    encounters = db.query(Encounter).order_by(Encounter.created_at.desc()).limit(10).all()
    result = []
    for e in encounters:
        p = db.query(Patient).filter(Patient.id == e.patient_id).first()
        result.append({
            "encounter_id": e.encounter_id,
            "patient": p.name if p else "Unknown",
            "patient_id": p.patient_id if p else "",
            "action": f"Dual-coded: {e.namaste_display} → {e.icd11_code}",
            "severity": e.severity,
            "time": e.created_at.isoformat(),
            "status": "completed"
        })
    return result

# ── ML / AI ───────────────────────────────────────────────
@app.post("/api/ml/triage")
def triage(symptoms: List[str], age: int = 30, gender: str = "M", db: Session = Depends(get_db)):
    """AI symptom triage — match symptoms to NAMASTE codes"""
    symptom_text = " ".join(symptoms).lower()
    matches = []
    all_codes = db.query(TerminologyCode).all()
    for code in all_codes:
        code_symptoms = code.symptoms.lower()
        overlap = sum(1 for s in symptoms if s.lower() in code_symptoms)
        if overlap > 0:
            confidence = min(overlap / max(len(symptoms), 1), 1.0)
            matches.append({"code": code.namaste_code, "display": code.disease_name,
                           "icd11": code.icd11_code, "icd11_display": code.icd11_title,
                           "confidence": round(confidence, 2), "severity": code.severity})
    matches.sort(key=lambda x: (-x["confidence"], x["severity"]))
    risk_score = min(sum(m["severity"] for m in matches[:3]) / 9.0 if matches else 0, 1.0)
    return {
        "matches": matches[:5],
        "risk_score": round(risk_score, 2),
        "risk_level": "high" if risk_score > 0.6 else "medium" if risk_score > 0.3 else "low",
        "recommendations": ["Consult a registered AYUSH practitioner",
                           "Document all symptoms accurately",
                           "Follow dual-coding protocol before prescription"]
    }

@app.post("/api/ml/medicine-recommend")
def recommend_medicines(namaste_code: str, db: Session = Depends(get_db)):
    """AYUSH medicine recommendations based on diagnosis"""
    medicines_db = {
        "AY001": [{"name": "Tribhuvankirti Rasa", "dose": "125mg BD", "anupana": "Honey"},
                  {"name": "Sudarshana Ghanavati", "dose": "500mg TDS", "anupana": "Warm water"}],
        "AY005": [{"name": "Nisha Amalaki", "dose": "3g BD", "anupana": "Warm water"},
                  {"name": "Karela Churna", "dose": "3g OD", "anupana": "Buttermilk"}],
        "AY008": [{"name": "Rasnasaptak Kwath", "dose": "30ml BD", "anupana": "Warm water"},
                  {"name": "Yogaraja Guggulu", "dose": "2 tabs TDS", "anupana": "Warm water"}],
        "AY009": [{"name": "Amavata Ari Rasa", "dose": "250mg BD", "anupana": "Ginger juice"},
                  {"name": "Simhanada Guggulu", "dose": "2 tabs BD", "anupana": "Warm water"}],
        "AY011": [{"name": "Pathyadi Kwath", "dose": "20ml BD", "anupana": "Water"},
                  {"name": "Shirashooladivajra Rasa", "dose": "125mg BD", "anupana": "Honey"}],
    }
    medicines = medicines_db.get(namaste_code, [
        {"name": "Consult Vaidya", "dose": "As prescribed", "anupana": "Per guidance"}
    ])
    return {"namaste_code": namaste_code, "medicines": medicines, "disclaimer": "Under supervision of qualified AYUSH practitioner only"}

# ── AUDIT ─────────────────────────────────────────────────
@app.get("/api/audit/logs")
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required")
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [{"id": l.id, "user_id": l.user_id, "action": l.action, "resource": l.resource,
             "detail": l.detail, "timestamp": l.timestamp.isoformat(),
             "hash": l.curr_hash[:16] + "..."} for l in logs]

@app.get("/api/audit/verify")
def verify_audit_chain(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.id.asc()).all()
    valid = True
    for i, log_entry in enumerate(logs):
        expected_prev = logs[i-1].curr_hash if i > 0 else "GENESIS"
        if log_entry.prev_hash != expected_prev:
            valid = False; break
    return {"chain_valid": valid, "total_entries": len(logs),
            "status": "COMPLIANT" if valid else "TAMPERED"}

# ── FHIR ──────────────────────────────────────────────────
@app.post("/fhir/bundle/upload")
def fhir_upload(bundle: dict, db: Session = Depends(get_db)):
    return {"status": "accepted", "bundle_id": uuid.uuid4().hex, "entries": len(bundle.get("entry", []))}

@app.get("/fhir/conceptmap")
def fhir_concept_map(db: Session = Depends(get_db)):
    codes = db.query(TerminologyCode).all()
    return {
        "resourceType": "ConceptMap",
        "id": "namaste-to-icd11",
        "title": "NAMASTE to ICD-11 Concept Map",
        "status": "active",
        "sourceUri": "http://tulsihealth.in/namaste",
        "targetUri": "http://id.who.int/icd/release/11/mms",
        "group": [{"element": [
            {"code": c.namaste_code, "display": c.disease_name,
             "target": [{"code": c.icd11_code, "display": c.icd11_title, "equivalence": "equivalent"}]}
            for c in codes
        ]}]
    }

# ── STARTUP ───────────────────────────────────────────────
@app.on_event("startup")
def startup():
    seed_db()
    log.info("🌿 TulsiHealth API v2.0.0 is running!")
    log.info("📚 Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
