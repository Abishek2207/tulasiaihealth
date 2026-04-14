from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from core.database import get_db
from api.models.user import User
from services.auth_service import auth_service
from services.audit_service import audit_service


router = APIRouter()
security = HTTPBearer()


class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str  # doctor, clinician, patient, admin
    phone: Optional[str] = None
    qualifications: Optional[list] = None


class FaceLogin(BaseModel):
    username: str
    face_image: str  # Base64 encoded image


class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    
    # Verify token
    payload = auth_service.verify_token(credentials.credentials)
    username = payload.get("sub")
    
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.username == username).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=user.id,
        action="R",
        resource_type="User",
        resource_id=str(user.id),
        operation="authenticate",
        outcome="0"  # success
    )
    
    return user


@router.post("/register", response_model=Token)
async def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Validate role
    valid_roles = ["doctor", "clinician", "patient", "admin"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}"
        )
    
    # Create new user
    hashed_password = auth_service.get_password_hash(user_data.password)
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        qualifications=user_data.qualifications,
        is_active=True,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": new_user.username, "role": new_user.role, "user_id": new_user.id}
    )
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=new_user.id,
        action="C",
        resource_type="User",
        resource_id=str(new_user.id),
        operation="register",
        outcome="0"
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_info={
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    )


@router.post("/login", response_model=Token)
async def login_user(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with username and password"""
    
    # Authenticate user
    user = auth_service.authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=user.id,
        action="R",
        resource_type="User",
        resource_id=str(user.id),
        operation="login",
        outcome="0"
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_info={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )


@router.post("/face-login", response_model=Token)
async def login_with_face(
    face_data: FaceLogin,
    db: Session = Depends(get_db)
):
    """Login using face recognition"""
    
    # Get user
    user = db.query(User).filter(User.username == face_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    if not user.face_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face not registered. Please register face first."
        )
    
    # Verify face
    is_valid_face = auth_service.verify_face(user.face_embedding, face_data.face_image)
    
    if not is_valid_face:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face verification failed"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.id}
    )
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=user.id,
        action="R",
        resource_type="User",
        resource_id=str(user.id),
        operation="face_login",
        outcome="0"
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_info={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    )


@router.post("/register-face")
async def register_face(
    face_data: FaceLogin,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register face for biometric login"""
    
    # Encode face
    face_embedding = auth_service.encode_face_embedding(face_data.face_image)
    
    if not face_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in image"
        )
    
    # Store face embedding
    current_user.face_embedding = face_embedding
    db.commit()
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="U",
        resource_type="User",
        resource_id=str(current_user.id),
        operation="register_face",
        outcome="0"
    )
    
    return {"message": "Face registered successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "qualifications": current_user.qualifications,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "has_face_registered": bool(current_user.face_embedding)
    }


@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user (client-side token invalidation)"""
    
    # Log audit event
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="R",
        resource_type="User",
        resource_id=str(current_user.id),
        operation="logout",
        outcome="0"
    )
    
    return {"message": "Logged out successfully"}
