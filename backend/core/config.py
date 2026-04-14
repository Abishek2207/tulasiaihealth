from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./tulsihealth.db"
    
    # Redis (Fallback for local)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ABHA Integration
    ABHA_CLIENT_ID: Optional[str] = None
    ABHA_CLIENT_SECRET: Optional[str] = None
    ABHA_BASE_URL: str = "https://healthid.ndhm.gov.in/api"
    
    # ICD-11 API
    ICD11_BASE_URL: str = "https://id.who.int/icd/entity"
    ICD11_API_URL: str = "https://icd.who.int/browse11/l-m/en"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # File paths
    DATA_DIR: str = "./data"
    NAMASTE_CSV_PATH: str = "./data/namaste_codes.csv"
    
    # AI/ML
    FACE_RECOGNITION_TOLERANCE: float = 0.6
    ML_MODEL_PATH: str = "./models"
    
    # QR Code
    QR_CODE_EXPIRY_MINUTES: int = 15
    
    # Audit
    AUDIT_LOG_RETENTION_DAYS: int = 365
    
    class Config:
        env_file = ".env"


settings = Settings()
