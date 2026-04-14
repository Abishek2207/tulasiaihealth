"""
Configuration settings for TulsiHealth
Production-ready settings with environment variable support
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "TulsiHealth"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./tulsihealth.db"
    database_echo: bool = False
    
    # Redis
    redis_url: str = "redis://:redis_secure_2024@localhost:6379/0"
    redis_expire: int = 3600  # 1 hour
    
    # ChromaDB
    chroma_url: str = "http://localhost:8001"
    chroma_collection: str = "tulsihealth_knowledge"
    
    # JWT Security
    jwt_secret_key: str = "tulsihealth_jwt_secret_key_2024_very_long_random_string_for_rs256"
    jwt_public_key: str = "tulsihealth_jwt_public_key_2024_very_long_random_string_for_rs256"
    jwt_algorithm: str = "RS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    
    # API Keys
    groq_api_key: Optional[str] = None
    huggingface_api_key: Optional[str] = None
    
    # WHO ICD API
    who_icd_api_url: str = "https://id.who.int/icd/release/11/2024-01/mms"
    who_icd_api_version: str = "v2"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://tulsihealth.in"
    ]
    
    # Rate Limiting
    rate_limit_per_minute: int = 100
    rate_limit_per_hour: int = 1000
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: List[str] = [".pdf", ".doc", ".docx", ".jpg", ".png", ".jpeg"]
    
    # Face Recognition
    face_recognition_threshold: float = 0.85
    face_embedding_size: int = 128
    
    # QR Code
    qr_token_expire_hours: int = 24
    qr_token_length: int = 32
    
    # FHIR
    fhir_base_url: str = "https://tulsihealth.in/fhir"
    fhir_version: str = "R4"
    
    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/tulsihealth.log"
    
    # Security
    bcrypt_rounds: int = 12
    session_timeout_minutes: int = 60
    
    # Backup
    backup_enabled: bool = True
    backup_interval_hours: int = 24
    backup_retention_days: int = 30
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9090
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Settings instance
settings = get_settings()
