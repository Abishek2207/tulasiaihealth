from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from api.database import get_db
from api.models.database import User, Patient, Consent, UserRole
from api.deps import get_current_active_user, require_role
from api.services.auth_service import auth_service
from api.services.audit_service import audit_service
from api.services.qr_service import qr_service

router = APIRouter()

class PatientCreate(BaseModel):
    name: str
    date_of_birth: datetime
    gender: str  # M, F, O
    state: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    abha_id: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    chronic_conditions: Optional[List[str]] = []

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None

class PatientResponse(BaseModel):
    id: uuid.UUID
    tulsi_id: str
    name: str
    date_of_birth: datetime
    gender: str
    state: str
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    abha_id: Optional[str]
    blood_group: Optional[str]
    allergies: Optional[List[str]]
    chronic_conditions: Optional[List[str]]
    qr_token: str
    qr_code_data: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_data: PatientCreate,
    current_user: User = Depends(require_role(UserRole.CLINICIAN)), # Or doctor/admin
    db: AsyncSession = Depends(get_db)
):
    """Create a new patient matching modern models"""
    # Generate tulsi_id: TH-YYYY-ST-NNNNNN
    year = datetime.now(timezone.utc).year
    state = patient_data.state.upper()
    random_num = str(uuid.uuid4().int)[:6]
    tulsi_id = f"TH-{year}-{state}-{random_num}"
    
    qr_token = str(uuid.uuid4())
    qr_expiry = datetime.now(timezone.utc) + timedelta(days=365) # 1 year expiry

    new_patient = Patient(
        tulsi_id=tulsi_id,
        name=patient_data.name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        state=state,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        abha_id=patient_data.abha_id,
        blood_group=patient_data.blood_group,
        allergies=patient_data.allergies,
        chronic_conditions=patient_data.chronic_conditions,
        qr_token=qr_token,
        qr_expiry=qr_expiry
    )
    
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    
    # Audit log
    await audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        resource_type="Patient",
        resource_id=str(new_patient.id),
        operation="create_patient",
        outcome="success",
        ip_address="127.0.0.1"
    )
    
    # Generate QR Code string
    try:
        import qrcode
        import io
        import base64
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"TULSI:{tulsi_id}:{qr_token}")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        setattr(new_patient, 'qr_code_data', f"data:image/png;base64,{qr_base64}")
    except Exception as e:
        setattr(new_patient, 'qr_code_data', None)

    return new_patient

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Patient).offset(skip).limit(limit)
    result = await db.execute(query)
    patients = result.scalars().all()
    
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="READ", resource_type="Patient",
        resource_id="list", operation="get_patients", outcome="success", ip_address="127.0.0.1"
    )
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="READ", resource_type="Patient",
        resource_id=str(patient.id), operation="get_patient", outcome="success", ip_address="127.0.0.1"
    )
    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: uuid.UUID,
    patient_data: PatientUpdate,
    current_user: User = Depends(require_role(UserRole.DOCTOR)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    await db.commit()
    await db.refresh(patient)
    return patient

@router.post("/scan-qr")
async def scan_patient_qr(
    qr_data: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Scan QR: Format TULSI:tulsi_id:qr_token"""
    if not qr_data.startswith("TULSI:"):
        raise HTTPException(status_code=400, detail="Invalid QR Format")
        
    parts = qr_data.split(":")
    if len(parts) != 3:
        raise HTTPException(status_code=400, detail="Invalid QR parts")
        
    tulsi_id, qr_token = parts[1], parts[2]
    
    result = await db.execute(
        select(Patient).where(Patient.tulsi_id == tulsi_id, Patient.qr_token == qr_token)
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Invalid QR Token or Patient not found")
        
    await audit_service.log_event(
        db=db, user_id=current_user.id, action="READ", resource_type="Patient",
        resource_id=str(patient.id), operation="scan_qr", outcome="success", ip_address="127.0.0.1"
    )
    
    return {
        "id": patient.id,
        "tulsi_id": patient.tulsi_id,
        "name": patient.name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies
    }
