import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from fastapi import HTTPException, status
import face_recognition
import numpy as np
import cv2
import base64
import io
from PIL import Image

from core.config import settings
from api.models.user import User


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def authenticate_user(self, db, username: str, password: str) -> Optional[User]:
        """Authenticate user with username and password"""
        user = db.query(User).filter(User.username == username).first()
        
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        
        return user
    
    def encode_face_embedding(self, face_image_data: str) -> Optional[str]:
        """Encode face image to embedding string"""
        try:
            # Decode base64 image
            image_data = base64.b64decode(face_image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to numpy array
            image_array = np.array(image)
            
            # Convert RGB to BGR for face_recognition
            if len(image_array.shape) == 3:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            # Find face locations
            face_locations = face_recognition.face_locations(image_array)
            
            if not face_locations:
                return None
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            
            if not face_encodings:
                return None
            
            # Return the first face encoding as JSON string
            embedding = face_encodings[0].tolist()
            return str(embedding)
            
        except Exception as e:
            print(f"Error encoding face: {e}")
            return None
    
    def verify_face(self, stored_embedding: str, new_face_data: str) -> bool:
        """Verify face against stored embedding"""
        try:
            # Get new face embedding
            new_embedding_data = self.encode_face_embedding(new_face_data)
            
            if not new_embedding_data:
                return False
            
            # Convert stored embedding back to numpy array
            stored_embedding_list = eval(stored_embedding)
            stored_embedding_np = np.array(stored_embedding_list)
            
            # Convert new embedding to numpy array
            new_embedding_list = eval(new_embedding_data)
            new_embedding_np = np.array(new_embedding_list)
            
            # Compare face embeddings
            face_distance = face_recognition.face_distance([stored_embedding_np], new_embedding_np)[0]
            
            # Check if face matches within tolerance
            return face_distance <= settings.FACE_RECOGNITION_TOLERANCE
            
        except Exception as e:
            print(f"Error verifying face: {e}")
            return False
    
    def generate_patient_id(self) -> str:
        """Generate TulsiHealth patient ID: TH-YYYY-MM-NNNN"""
        now = datetime.now()
        year_month = now.strftime("%Y-%m")
        
        # In production, this would query the database to get the next sequence number
        # For now, use a simple counter
        import random
        sequence = random.randint(1000, 9999)
        
        return f"TH-{year_month}-{sequence}"
    
    def generate_consent_token(self) -> str:
        """Generate consent token for QR codes"""
        import secrets
        return secrets.token_urlsafe(32)
    
    def encrypt_qr_data(self, patient_id: str, consent_token: str) -> str:
        """Encrypt QR code data"""
        # Simple encryption for demo - in production use proper encryption
        from cryptography.fernet import Fernet
        
        # Generate key (in production, this would be stored securely)
        key = Fernet.generate_key()
        f = Fernet(key)
        
        data = f"{patient_id}:{consent_token}"
        encrypted_data = f.encrypt(data.encode())
        
        return encrypted_data.decode()
    
    def decrypt_qr_data(self, encrypted_data: str) -> tuple:
        """Decrypt QR code data"""
        # Simple decryption for demo - in production use proper decryption
        from cryptography.fernet import Fernet
        
        # This is a simplified version - in production, the key would be stored securely
        try:
            # For demo purposes, return the data as-is if it's not encrypted
            if ":" in encrypted_data:
                patient_id, consent_token = encrypted_data.split(":", 1)
                return patient_id, consent_token
            else:
                return None, None
        except:
            return None, None


# Global auth service instance
auth_service = AuthService()
