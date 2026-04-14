"""
Dependencies for TulsiHealth API
Common dependencies for route handlers
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.models.database import User, UserRole
from api.services.auth_service import auth_service
from api.database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    try:
        # Verify token
        token_data = auth_service.verify_token(credentials.credentials)
        
        # Get user from database
        result = await db.execute(
            select(User).where(User.id == token_data.user_id)
        )
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_role(required_role: UserRole):
    """Dependency to require specific user role"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not auth_service.check_permission(current_user.role, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker


# Role-specific dependencies
require_admin = require_role(UserRole.ADMIN)
require_doctor = require_role(UserRole.DOCTOR)
require_clinician = require_role(UserRole.CLINICIAN)
require_doctor_or_clinician = require_role(UserRole.DOCTOR)  # Doctors can access clinician resources


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user if token provided, otherwise None"""
    if not credentials:
        return None
    
    try:
        token_data = auth_service.verify_token(credentials.credentials)
        
        result = await db.execute(
            select(User).where(User.id == token_data.user_id)
        )
        user = result.scalar_one_or_none()
        
        return user if user and user.is_active else None
        
    except Exception:
        return None


def get_pagination_params(
    page: int = 1,
    limit: int = 20
) -> dict:
    """Get pagination parameters"""
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Page must be >= 1"
        )
    
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 100"
        )
    
    offset = (page - 1) * limit
    
    return {"offset": offset, "limit": limit}


def get_date_range_params(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    """Get date range parameters"""
    from datetime import datetime, timezone
    
    params = {}
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
            params["start_date"] = start_dt
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use ISO format."
            )
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            params["end_date"] = end_dt
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use ISO format."
            )
    
    # Validate date range
    if "start_date" in params and "end_date" in params:
        if params["start_date"] > params["end_date"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be before end_date"
            )
    
    return params


async def verify_patient_access(
    patient_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> bool:
    """Verify user has access to patient data"""
    try:
        # Admins can access all patients
        if current_user.role == UserRole.ADMIN:
            return True
        
        # Doctors and clinicians need to check consent/hospital affiliation
        if current_user.role in [UserRole.DOCTOR, UserRole.CLINICIAN]:
            # In production, check consent records and hospital affiliation
            # For now, allow access
            return True
        
        # Patients can only access their own data
        if current_user.role == UserRole.USER:
            # Check if patient belongs to user
            from api.models.database import Patient
            result = await db.execute(
                select(Patient).where(Patient.id == patient_id)
            )
            patient = result.scalar_one_or_none()
            
            if not patient:
                return False
            
            # Check if this patient is linked to the user
            # This would depend on your user-patient relationship model
            return False  # Placeholder
        
        return False
        
    except Exception:
        return False


def require_patient_access(patient_id_param: str = "patient_id"):
    """Dependency to require patient access"""
    async def patient_access_checker(
        patient_id: str,
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> bool:
        has_access = await verify_patient_access(patient_id, current_user, db)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to access patient data"
            )
        return True
    
    return patient_access_checker


async def get_user_hospital(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Optional[str]:
    """Get user's hospital ID"""
    if not current_user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a hospital"
        )
    
    return str(current_user.hospital_id)


def validate_state_code(state: str) -> str:
    """Validate Indian state code"""
    valid_states = {
        'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DN', 'DD', 'DL', 'GA', 'GJ',
        'HR', 'HP', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML', 'MN', 'MP', 'MZ',
        'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TR', 'TS', 'UP', 'UK', 'WB'
    }
    
    if state.upper() not in valid_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state code. Valid codes are: {', '.join(valid_states)}"
        )
    
    return state.upper()


def validate_phone_number(phone: str) -> str:
    """Validate Indian phone number"""
    import re
    
    # Remove any non-digit characters
    phone_digits = re.sub(r'\D', '', phone)
    
    # Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if len(phone_digits) == 10 and phone_digits[0] in '6789':
        return phone_digits
    
    # Check if it includes country code
    if len(phone_digits) == 12 and phone_digits.startswith('91'):
        return phone_digits[2:]  # Return without country code
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid Indian phone number. Must be 10 digits starting with 6-9"
    )


def validate_abha_id(abha_id: str) -> str:
    """Validate ABHA ID format"""
    import re
    
    # ABHA ID should be 12 digits
    if not re.match(r'^\d{12}$', abha_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ABHA ID format. Must be 12 digits"
        )
    
    return abha_id


def validate_tulsi_id(tulsi_id: str) -> str:
    """Validate TulsiHealth ID format"""
    import re
    
    # TH-YYYY-ST-NNNNNN format
    if not re.match(r'^TH-\d{4}-[A-Z]{2}-\d{6}$', tulsi_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TulsiHealth ID format. Expected: TH-YYYY-ST-NNNNNN"
        )
    
    return tulsi_id


async def check_rate_limit(
    identifier: str,
    limit: int = 100,
    window_minutes: int = 60
) -> bool:
    """Check rate limit for an identifier"""
    # In production, use Redis or similar for rate limiting
    # For now, always allow
    return True


def rate_limit(limit: int = 100, window_minutes: int = 60):
    """Rate limiting decorator"""
    async def rate_limiter(
        request,
        current_user: User = Depends(get_current_active_user)
    ):
        identifier = f"user_{current_user.id}"
        
        if not await check_rate_limit(identifier, limit, window_minutes):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {limit} requests per {window_minutes} minutes."
            )
        
        return current_user
    
    return rate_limiter


async def log_api_call(
    endpoint: str,
    user_id: str,
    method: str,
    status_code: int,
    response_time_ms: float
):
    """Log API call for monitoring"""
    # In production, log to monitoring system
    pass


def get_client_ip(request) -> str:
    """Get client IP address"""
    # Check for forwarded headers
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host


def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """Validate file size"""
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {max_size_mb}MB"
        )
    
    return True


def validate_file_type(filename: str, allowed_extensions: list) -> bool:
    """Validate file type"""
    import os
    
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    return True
