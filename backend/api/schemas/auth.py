"""
Authentication Schemas for TulsiHealth
Pydantic models for authentication requests and responses
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

from api.models.database import UserRole


class UserRoleEnum(str, Enum):
    USER = "user"
    DOCTOR = "doctor"
    CLINICIAN = "clinician"
    ADMIN = "admin"


class RegisterRequest(BaseModel):
    """Request model for user registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    role: UserRoleEnum = Field(..., description="User role")
    state: str = Field(..., min_length=2, max_length=2, description="State code (2 letters)")
    hospital_id: Optional[str] = Field(None, description="Hospital ID (if applicable)")
    abha_id: Optional[str] = Field(None, description="ABHA ID (if available)")
    phone: Optional[str] = Field(None, description="Phone number")
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('state')
    def validate_state(cls, v):
        if len(v) != 2 or not v.isalpha():
            raise ValueError('State code must be 2 letters')
        return v.upper()


class LoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class RefreshTokenRequest(BaseModel):
    """Request model for token refresh"""
    refresh_token: str = Field(..., description="Refresh token")


class FaceAuthRequest(BaseModel):
    """Request model for face authentication"""
    user_id: str = Field(..., description="User ID")
    face_image: str = Field(..., description="Base64 encoded face image")
    
    @validator('face_image')
    def validate_face_image(cls, v):
        if not v.startswith('data:image/'):
            raise ValueError('Face image must be a valid data URL')
        return v


class QRTokenRequest(BaseModel):
    """Request model for QR token generation"""
    patient_id: str = Field(..., description="Patient ID")
    expires_hours: int = Field(24, ge=1, le=168, description="Token expiration in hours")


class TokenData(BaseModel):
    """Token data model"""
    user_id: str
    role: str
    email: Optional[str] = None
    abha_id: Optional[str] = None
    exp: Optional[float] = None


class UserInfo(BaseModel):
    """User information model"""
    id: str
    email: str
    name: str
    role: UserRoleEnum
    abha_id: Optional[str] = None
    is_verified: bool = False


class TokenResponse(BaseModel):
    """Response model for authentication tokens"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo
    
    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "doctor@tulsihealth.in",
                    "name": "Dr. Ramesh Kumar",
                    "role": "doctor",
                    "abha_id": "ABHA123456789012",
                    "is_verified": True
                }
            }
        }


class PasswordChangeRequest(BaseModel):
    """Request model for password change"""
    old_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('New password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('New password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('New password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('New password must contain at least one digit')
        return v


class TokenVerificationResponse(BaseModel):
    """Response model for token verification"""
    valid: bool
    user_id: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    abha_id: Optional[str] = None
    expires_at: Optional[str] = None


class UserPermissions(BaseModel):
    """User permissions model"""
    role: UserRoleEnum
    permissions: Dict[str, bool]


class FaceRegistrationResponse(BaseModel):
    """Response model for face registration"""
    message: str
    success: bool = True


class QRTokenResponse(BaseModel):
    """Response model for QR token"""
    qr_token: str
    patient_id: str
    tulsi_id: str
    expires_hours: str


class QRScanResponse(BaseModel):
    """Response model for QR scan"""
    patient_id: str
    tulsi_id: str
    name: str
    date_of_birth: str
    gender: str
    blood_group: Optional[str] = None
    state: str
    allergies: list = []
    chronic_conditions: list = []
    current_medications: list = []


class LogoutResponse(BaseModel):
    """Response model for logout"""
    message: str


class APIResponse(BaseModel):
    """Generic API response model"""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {}
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "message": "Validation error occurred",
                "error_code": "VALIDATION_ERROR",
                "details": {
                    "field": "email",
                    "error": "Invalid email format"
                }
            }
        }


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    timestamp: datetime
    services: Dict[str, str]
    version: str = "1.0.0"
