"""
Authentication Service for TulsiHealth
Handles JWT tokens, user authentication, and authorization
"""

import asyncio
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from api.models.database import User, Patient, UserRole
from api.core.config import get_settings
from api.schemas.auth import TokenData, LoginRequest, RegisterRequest
from api.services.face_service import face_service

settings = get_settings()
logger = __import__('logging').getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")


class AuthService:
    """Handles authentication and authorization"""
    
    def __init__(self):
        self.secret_key = settings.jwt_secret_key
        self.public_key = settings.jwt_public_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.jwt_access_token_expire_minutes
        self.refresh_token_expire_days = settings.jwt_refresh_token_expire_days
        self.face_recognition_threshold = settings.face_recognition_threshold
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        
        try:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Token creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create access token"
            )
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        try:
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Refresh token creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create refresh token"
            )
    
    def verify_token(self, token: str, token_type: str = "access") -> TokenData:
        """Verify JWT token and return token data"""
        try:
            payload = jwt.decode(token, self.public_key, algorithms=[self.algorithm])
            
            # Check token type
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}"
                )
            
            # Extract user ID
            user_id: str = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials"
                )
            
            # Extract role
            role: str = payload.get("role", "user")
            
            # Extract other claims
            email: Optional[str] = payload.get("email")
            abha_id: Optional[str] = payload.get("abha_id")
            
            token_data = TokenData(
                user_id=user_id,
                role=role,
                email=email,
                abha_id=abha_id,
                exp=payload.get("exp")
            )
            
            return token_data
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError as e:
            logger.error(f"JWT verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        try:
            result = await db.execute(
                select(User).where(User.email == email)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                return None
            
            if not self.verify_password(password, user.password_hash):
                return None
            
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User account is inactive"
                )
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            await db.commit()
            
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise
    
    async def authenticate_patient(self, db: AsyncSession, tulsi_id: str, password: str) -> Optional[Patient]:
        """Authenticate patient with Tulsi ID and password"""
        try:
            # For patients, we use a simple password system
            # In production, this would use ABHA authentication
            result = await db.execute(
                select(Patient).where(Patient.tulsi_id == tulsi_id)
            )
            patient = result.scalar_one_or_none()
            
            if not patient:
                return None
            
            # Simple password verification for demo
            # In production, use ABHA integration
            if password != f"patient_{patient.tulsi_id[-6:]}":
                return None
            
            return patient
            
        except Exception as e:
            logger.error(f"Patient authentication error: {e}")
            return None
    
    async def register_user(self, db: AsyncSession, user_data: RegisterRequest) -> User:
        """Register a new user"""
        try:
            # Check if user already exists
            result = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Check ABHA ID if provided
            if user_data.abha_id:
                result = await db.execute(
                    select(User).where(User.abha_id == user_data.abha_id)
                )
                existing_abha = result.scalar_one_or_none()
                
                if existing_abha:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="ABHA ID already registered"
                    )
            
            # Hash password
            hashed_password = self.get_password_hash(user_data.password)
            
            # Create user
            user = User(
                email=user_data.email,
                phone=user_data.phone,
                name=user_data.name,
                role=user_data.role,
                state=user_data.state,
                hospital_id=user_data.hospital_id,
                abha_id=user_data.abha_id,
                password_hash=hashed_password,
                is_active=True,
                is_verified=False,
                email_verified_at=None
            )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"User registered: {user.email}")
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"User registration error: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed"
            )
    
    async def authenticate_with_face(self, db: AsyncSession, user_id: str, face_image_data: str) -> Optional[User]:
        """Authenticate user with face recognition"""
        try:
            # Get user
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user or not user.face_embedding:
                return None
            
            # Decode face image
            try:
                # Remove data URL prefix if present
                if face_image_data.startswith('data:image'):
                    face_image_data = face_image_data.split(',')[1]
                
                image_data = base64.b64decode(face_image_data)
                image = Image.open(io.BytesIO(image_data))
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Convert to numpy array
                face_array = np.array(image)
                
            except Exception as e:
                logger.error(f"Face image processing error: {e}")
                return None
            
            # Get face encoding and verify
            try:
                stored_embedding = user.face_embedding.get('embedding')
                if not stored_embedding:
                    return None
                
                # Perform verification using the uploaded image
                result = face_service.verify_face(stored_embedding, image_data)
                
                if result.get("verified"):
                    logger.info(f"Face authentication successful for user: {user.email} (Confidence: {result.get('confidence')})")
                    
                    # Update last login
                    user.last_login = datetime.now(timezone.utc)
                    await db.commit()
                    
                    return user
                else:
                    logger.warning(f"Face recognition failed for {user.email}: {result.get('error', 'Low confidence')}")
                    return None
                    
            except Exception as e:
                logger.error(f"Face comparison error: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Face authentication error: {e}")
            return None
    
    async def store_face_embedding(self, db: AsyncSession, user_id: str, face_image_data: str) -> bool:
        """Store face embedding for user"""
        try:
            # Get user
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Process face image
            try:
                # Remove data URL prefix if present
                if face_image_data.startswith('data:image'):
                    face_image_data = face_image_data.split(',')[1]
                
                image_data = base64.b64decode(face_image_data)
                image = Image.open(io.BytesIO(image_data))
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Convert to numpy array
                face_array = np.array(image)
                
            except Exception as e:
                logger.error(f"Face image processing error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid face image"
                )
            
            # Generate face embedding
            try:
                face_encoding = face_service.get_embedding(image_data)
                
                if not face_encoding:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No face detected in image"
                    )
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Face encoding error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Face encoding failed"
                )
            
            # Store embedding
            try:
                user.face_embedding = {
                    'embedding': face_encoding.tolist(),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'algorithm': 'face_recognition',
                    'version': '1.0'
                }
                
                await db.commit()
                
                logger.info(f"Face embedding stored for user: {user.email}")
                return True
                
            except Exception as e:
                logger.error(f"Face embedding storage error: {e}")
                await db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to store face embedding"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Face embedding storage error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Face embedding storage failed"
            )
    
    async def refresh_access_token(self, db: AsyncSession, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            token_data = self.verify_token(refresh_token, "refresh")
            
            # Get user
            result = await db.execute(
                select(User).where(User.id == token_data.user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
            
            # Create new access token
            access_token = self.create_access_token(
                data={
                    "sub": str(user.id),
                    "role": user.role.value,
                    "email": user.email,
                    "abha_id": user.abha_id
                }
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )
    
    def check_permission(self, user_role: UserRole, required_role: UserRole) -> bool:
        """Check if user has required role"""
        role_hierarchy = {
            UserRole.USER: 0,
            UserRole.CLINICIAN: 1,
            UserRole.DOCTOR: 2,
            UserRole.ADMIN: 3
        }
        
        return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)
    
    def generate_qr_token(self, user_id: str, expires_hours: int = 24) -> str:
        """Generate QR token for patient identification"""
        expires_delta = timedelta(hours=expires_hours)
        token_data = {
            "sub": user_id,
            "type": "qr",
            "purpose": "patient_identification"
        }
        
        return self.create_access_token(token_data, expires_delta)
    
    async def verify_qr_token(self, db: AsyncSession, qr_token: str) -> Optional[Patient]:
        """Verify QR token and return patient"""
        try:
            # Verify token
            token_data = self.verify_token(qr_token, "qr")
            
            # Check if it's a QR token
            if token_data.exp < datetime.now(timezone.utc).timestamp():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="QR token has expired"
                )
            
            # Get patient
            result = await db.execute(
                select(Patient).where(Patient.id == token_data.user_id)
            )
            patient = result.scalar_one_or_none()
            
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            return patient
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"QR token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid QR token"
            )


# Global auth service instance
auth_service = AuthService()
