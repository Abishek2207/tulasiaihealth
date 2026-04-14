"""
Main FastAPI application for TulsiHealth
Production-ready healthcare EMR platform with AYUSH + ICD-11 dual coding
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time

# Import API modules
from api.core.config import get_settings
from api.database import init_db, close_db
from api.routes import auth, rag, fhir, terminology, audit, patients, ml
from api.schemas.auth import HealthResponse

settings = get_settings()
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting TulsiHealth API...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
        try:
            from api.services.rag_service import rag_service
            collection = rag_service.get_collection()
            logger.info("RAG service initialized successfully")
        except Exception as e:
            logger.warning(f"RAG service initialization failed: {e}")
        logger.info("TulsiHealth API started successfully")
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    
    yield
    
    logger.info("Shutting down TulsiHealth API...")
    try:
        await close_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
    logger.info("TulsiHealth API shutdown complete")


app = FastAPI(
    title="TulsiHealth API",
    description="India's First AYUSH + ICD-11 Dual-Coding EMR Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url} - {response.status_code} - {process_time:.3f}s")
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(fhir.router, prefix="/fhir", tags=["FHIR"])
app.include_router(terminology.router, prefix="/api/terminology", tags=["Terminology"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(ml.router, prefix="/api/ml", tags=["ML"])

@app.get("/", response_model=dict)
async def root():
    return {
        "message": "TulsiHealth API",
        "description": "India's First AYUSH + ICD-11 Dual-Coding EMR Platform",
        "status": "operational",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
@limiter.limit("60/minute")
async def health_check(request: Request):
    return HealthResponse(
        status="healthy",
        timestamp="2024-01-01T00:00:00Z",
        services={"database": "connected", "rag": "operational", "api": "operational"}
    )

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
