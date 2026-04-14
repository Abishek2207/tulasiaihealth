"""
Authentication Routes for TulsiHealth
Handles user registration, login, token management, and face authentication
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pydantic

from api.models.database import User, Patient, UserRole
from api.services.auth_service import auth_service
from api.database import get_db
from api.schemas.auth import (
    TokenResponse, LoginRequest, RegisterRequest, 
    RefreshTokenRequest, FaceAuthRequest, QRTokenRequest
)
from api.deps import get_current_user, get_current_active_user

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=Dict[str, Any])
async def register(user_data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    try:
        # Validate password strength
        if len(user_data.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Register user
        user = await auth_service.register_user(db, user_data)
        
        # Create tokens
        access_token = auth_service.create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role.value,
                "email": user.email,
                "abha_id": user.abha_id
            }
        )
        
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        return {
            "message": "User registered successfully",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "abha_id": user.abha_id,
                "is_verified": user.is_verified
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": auth_service.access_token_expire_minutes * 60
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login user with email and password"""
    try:
        # Authenticate user
        user = await auth_service.authenticate_user(db, login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create tokens
        access_token = auth_service.create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role.value,
                "email": user.email,
                "abha_id": user.abha_id
            }
        )
        
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=auth_service.access_token_expire_minutes * 60,
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "abha_id": user.abha_id,
                "is_verified": user.is_verified
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh", response_model=Dict[str, str])
async def refresh_token(refresh_data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        tokens = await auth_service.refresh_access_token(db, refresh_data.refresh_token)
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )


@router.post("/face-login", response_model=TokenResponse)
async def face_login(face_data: FaceAuthRequest, db: AsyncSession = Depends(get_db)):
    """Login using face recognition"""
    try:
        # Authenticate with face
        user = await auth_service.authenticate_with_face(
            db, face_data.user_id, face_data.face_image
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Face authentication failed"
            )
        
        # Create tokens
        access_token = auth_service.create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role.value,
                "email": user.email,
                "abha_id": user.abha_id
            }
        )
        
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=auth_service.access_token_expire_minutes * 60,
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "abha_id": user.abha_id,
                "is_verified": user.is_verified
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face login failed: {str(e)}"
        )


@router.post("/register-face", response_model=Dict[str, str])
async def register_face(
    face_data: FaceAuthRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Register face embedding for user"""
    try:
        success = await auth_service.store_face_embedding(
            db, str(current_user.id), face_data.face_image
        )
        
        if success:
            return {"message": "Face embedding registered successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to register face embedding"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face registration failed: {str(e)}"
        )


@router.post("/generate-qr", response_model=Dict[str, str])
async def generate_qr_token(
    request: QRTokenRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate QR token for patient identification"""
    try:
        # Only doctors and clinicians can generate QR tokens
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Verify patient exists
        result = await db.execute(
            select(Patient).where(Patient.id == request.patient_id)
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Generate QR token
        qr_token = auth_service.generate_qr_token(str(patient.id), request.expires_hours)
        
        return {
            "qr_token": qr_token,
            "patient_id": str(patient.id),
            "tulsi_id": patient.tulsi_id,
            "expires_hours": str(request.expires_hours)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QR token generation failed: {str(e)}"
        )


@router.post("/scan-qr", response_model=Dict[str, Any])
async def scan_qr_token(
    qr_data: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Scan QR token and return patient information"""
    try:
        # Only doctors and clinicians can scan QR tokens
        if current_user.role not in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        
        # Verify QR token
        patient = await auth_service.verify_qr_token(db, qr_data["qr_token"])
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired QR token"
            )
        
        # Return patient summary (without sensitive data)
        return {
            "patient_id": str(patient.id),
            "tulsi_id": patient.tulsi_id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth.isoformat(),
            "gender": patient.gender,
            "blood_group": patient.blood_group,
            "state": patient.state,
            "allergies": patient.allergies or [],
            "chronic_conditions": patient.chronic_conditions or [],
            "current_medications": patient.current_medications or []
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"QR scan failed: {str(e)}"
        )


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value,
        "state": current_user.state,
        "abha_id": current_user.abha_id,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "email_verified_at": current_user.email_verified_at.isoformat() if current_user.email_verified_at else None,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "has_face_embedding": current_user.face_embedding is not None
    }


@router.post("/logout", response_model=Dict[str, str])
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user (client-side token invalidation)"""
    # In a real implementation, you might want to invalidate tokens on the server side
    # For now, we just return success and let the client discard the tokens
    return {"message": "Logout successful"}


@router.post("/change-password", response_model=Dict[str, str])
async def change_password(
    password_data: Dict[str, str],
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password"""
    try:
        old_password = password_data.get("old_password")
        new_password = password_data.get("new_password")
        
        if not old_password or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Old password and new password are required"
            )
        
        # Verify old password
        if not auth_service.verify_password(old_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid old password"
            )
        
        # Validate new password
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters long"
            )
        
        # Update password
        current_user.password_hash = auth_service.get_password_hash(new_password)
        await db.commit()
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )


@router.get("/verify-token", response_model=Dict[str, Any])
async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Verify JWT token and return token information"""
    try:
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user information
        result = await db.execute(
            select(User).where(User.id == token_data.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token or inactive user"
            )
        
        return {
            "valid": True,
            "user_id": token_data.user_id,
            "role": token_data.role,
            "email": token_data.email,
            "abha_id": token_data.abha_id,
            "expires_at": datetime.fromtimestamp(token_data.exp, tz=timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


@router.get("/permissions", response_model=Dict[str, Any])
async def get_user_permissions(current_user: User = Depends(get_current_active_user)):
    """Get user permissions and capabilities"""
    permissions = {
        "can_view_patients": current_user.role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN],
        "can_create_patients": current_user.role in [UserRole.DOCTOR, UserRole.CLINICIAN, UserRole.ADMIN],
        "can_view_all_patients": current_user.role in [UserRole.DOCTOR, UserRole.ADMIN],
        "can_manage_users": current_user.role == UserRole.ADMIN,
        "can_access_analytics": current_user.role in [UserRole.DOCTOR, UserRole.ADMIN],
        "can_manage_rag": current_user.role == UserRole.ADMIN,
        "can_sync_icd": current_user.role == UserRole.ADMIN,
        "can_view_audit_log": current_user.role in [UserRole.DOCTOR, UserRole.ADMIN],
        "can_use_face_auth": current_user.face_embedding is not None
    }
    
    return {
        "role": current_user.role.value,
        "permissions": permissions
    }
