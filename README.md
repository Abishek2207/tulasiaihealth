# TulsiHealth - India's First AYUSH + ICD-11 Dual-Coding EMR Platform

![TulsiHealth Logo](https://via.placeholder.com/200x80/facc15/14532d?text=TulsiHealth)

**Production-Grade Healthcare Platform by SmartAI Studio**

TulsiHealth is India's first Electronic Medical Record (EMR) platform that seamlessly integrates traditional AYUSH medicine (Ayurveda, Yoga, Unani, Siddha, Homeopathy) with modern ICD-11 coding standards through FHIR R4 compliance. Built with real data, production-grade architecture, and comprehensive offline capabilities.

## **Vision**

To bridge the gap between traditional Indian medicine systems and modern healthcare standards, enabling practitioners to leverage the best of both worlds while maintaining complete interoperability with global health systems.

## **Core Innovation**

- **Dual Coding System**: Every diagnosis is coded in both AYUSH terminology (NAMASTE/TM2) and ICD-11 MMS
- **FHIR R4 Compliance**: Full interoperability with global health systems
- **ABHA Integration**: Seamless integration with India's digital health ecosystem
- **AI-Powered**: Symptom extraction, recovery prediction, and medicine recommendations
- **Blockchain Audit**: Immutable audit trail with SHA-256 hash chain
- **Multilingual Support**: English, Tamil, and Hindi interfaces

---

## **Tech Stack**

### **Backend**
- **Framework**: FastAPI 0.104+ (Python 3.11+) with async/await support
- **Database**: PostgreSQL 15 (primary) + Redis 7 (cache) + ChromaDB (vector storage)
- **ORM**: SQLAlchemy 2.0 with Pydantic v2 models and Alembic migrations
- **FHIR**: fhir.resources Python library (R4) with validation
- **Authentication**: OAuth 2.0 + JWT RS256 + ABHA-linked tokens + Face recognition
- **AI/ML**: scikit-learn, transformers, OpenCV, sentence-transformers
- **Security**: ISO 22600 policy engine, SHA-256 hash chains, encrypted QR codes
- **WHO Integration**: ICD-11 API v2 for real-time terminology sync
- **Vector Database**: ChromaDB for RAG knowledge base with 500+ documents
- **Message Queue**: Redis for background tasks and session management

### **Frontend**
- **Framework**: Next.js 15 (App Router) + TypeScript 5.6+
- **Styling**: Tailwind CSS 3.4+ + Material-UI 6.1+ components
- **State Management**: TanStack Query 5.59+ + React Context API
- **Offline**: IndexedDB via Dexie.js 4.0+ + Service Worker PWA
- **Multilingual**: react-i18next 15.1+ with English/Tamil/Hindi support
- **Icons**: Lucide React 0.446+ for consistent iconography
- **Forms**: React Hook Form 7.53+ with Zod validation
- **Charts**: Recharts 2.12+ for data visualization
- **Camera**: react-webcam 7.1+ for face authentication
- **QR Codes**: qrcode 1.5+ for patient ID generation

### **Infrastructure**
- **Containerization**: Docker + docker-compose with multi-service orchestration
- **Database**: PostgreSQL 15 with optimized indexes and connection pooling
- **Caching**: Redis 7 for terminology, sessions, and real-time data
- **Vector Storage**: ChromaDB for RAG embeddings and semantic search
- **Reverse Proxy**: Nginx with SSL termination and load balancing
- **Monitoring**: Health checks, audit logging, and performance metrics
- **Security**: HTTPS headers, CORS, rate limiting, and input validation

---

## **Architecture Overview**

```
TulsiHealth Platform
    |
    |-- Frontend (Next.js 15 + PWA)
    |   |-- Dashboard (Role-based with real-time stats)
    |   |-- Patient Management (CRUD + offline sync)
    |   |-- Diagnosis Search (NAMASTE + ICD-11 dual-coding)
    |   |-- RAG Chat Widget (AI-powered medical assistant)
    |   |-- Face Authentication (Biometric login)
    |   |-- India Map (Healthcare analytics dashboard)
    |   |-- Patient ID Cards (ABHA integration)
    |   |-- Offline Mode (IndexedDB + Service Worker)
    |
    |-- Backend (FastAPI + Async)
    |   |-- Authentication Service (JWT + Face + QR)
    |   |-- Terminology Service (NAMASTE + ICD-11 sync)
    |   |-- FHIR Service (R4 resources + validation)
    |   |-- RAG Service (ChromaDB + LLM integration)
    |   |-- Audit Service (SHA-256 hash chains)
    |   |-- Patient Service (CRUD + ABHA linking)
    |   |-- ICD Sync Service (WHO API integration)
    |
    |-- Data Layer
    |   |-- PostgreSQL 15 (Primary database)
    |   |-- Redis 7 (Cache + sessions)
    |   |-- ChromaDB (Vector embeddings)
    |   |-- IndexedDB (Offline storage)
    |
    |-- External Integrations
    |   |-- ABHA (NDHM - India's Digital Health Ecosystem)
    |   |-- WHO ICD-11 API (Real-time terminology)
    |   |-- Face Recognition (OpenCV + ML models)
    |   |-- QR Code Generation (Encrypted patient tokens)
    |   |-- LLM Services (AI-powered diagnosis)
```

---

## **Key Features**

### **1. Terminology Service**
- **NAMASTE CodeSystem**: 50+ real AYUSH codes with detailed descriptions
- **ICD-11 Integration**: Real-time sync with WHO ICD-API v2 for TM2/MMS
- **Smart Search**: AI-powered autocomplete across NAMASTE + TM2 + ICD-11
- **Bidirectional Translation**: NAMASTE <-> ICD-11 with confidence scores
- **FHIR Compliant**: Full CodeSystem, ConceptMap, ValueSet resources
- **Knowledge Base**: 500+ documents including Ayurveda classics and safety rules

### **2. Patient Identity System**
- **Unique IDs**: TH-YYYY-MM-NNNN format with UUID generation
- **ABHA Integration**: Seamless linking with India's National Digital Health Ecosystem
- **QR Codes**: Encrypted patient tokens for cross-hospital access
- **Face Authentication**: Biometric login with secure face recognition
- **Role-based Access**: Admin/Doctor/Clinician/Patient visibility controls
- **Patient ID Cards**: Digital ID cards with emergency contact information

### **3. Dual-Coding EMR**
- **FHIR Resources**: Patient, Condition, Encounter, CodeSystem, ConceptMap, AuditEvent
- **Cluster Validation**: ICD-11 cluster rules enforced server-side
- **Audit Trail**: Immutable SHA-256 hash chain for all operations
- **Consent Management**: ISO 22600 compliant with purpose/scope controls
- **Real-time Validation**: Client-side and server-side FHIR validation

### **4. AI-Powered Features**
- **RAG Chat Widget**: AI medical assistant with 500+ document knowledge base
- **Symptom Extraction**: NLP-powered extraction from free text (Tamil/English/Hindi)
- **Recovery Prediction**: ML-based risk scoring with confidence intervals
- **Medicine Recommender**: Safe AYUSH formulations with contraindication checking
- **Face Recognition**: Biometric authentication with encrypted storage
- **India Analytics**: Interactive map with real-time healthcare statistics

### **5. Offline-First PWA**
- **Service Worker**: Background sync and offline functionality
- **IndexedDB**: Local storage via Dexie.js with 50MB capacity
- **Background Sync**: Automatic data synchronization when online
- **Encrypted Storage**: WebCrypto API for secure local data
- **Offline Pages**: Complete offline functionality for core features
- **Sync Management**: Real-time sync status and conflict resolution

---

## **Project Structure**

```
tulsihealth/
    |
    |-- docker-compose.yml          # Multi-service orchestration
    |-- README.md                    # This file
    |
    |-- backend/                     # FastAPI Python backend
    |   |-- main.py                  # Application entry point
    |   |-- requirements.txt          # Python dependencies
    |   |-- Dockerfile               # Backend container
    |   |-- alembic.ini              # Database migrations
    |
    |   |-- api/                     # API layer
    |   |   |-- routes/              # API endpoints
    |   |   |   |-- auth.py          # Authentication (JWT + Face + QR)
    |   |   |   |-- patients.py      # Patient management
    |   |   |   |-- terminology.py   # Terminology service
    |   |   |   |-- fhir.py          # FHIR resources
    |   |   |   |-- rag.py           # RAG AI assistant
    |   |   |   |-- audit.py         # Audit logging
    |   |   |   |-- terminology-new.py # ICD-11 sync
    |   |   |
    |   |   |-- models/              # Database models
    |   |   |   |-- user.py          # User accounts
    |   |   |   |-- patient.py       # Patient records
    |   |   |   |-- condition.py     # Dual-coded conditions
    |   |   |   |-- encounter.py     # Clinical encounters
    |   |   |   |-- codesystem.py    # Terminology systems
    |   |   |   |-- audit.py         # Audit trail
    |   |   |   |-- consent.py       # Consent management
    |   |   |
    |   |   |-- schemas/             # Pydantic schemas
    |   |   |   |-- auth.py          # Auth request/response models
    |   |   |   |-- patient.py       # Patient data models
    |   |   |   |-- fhir.py          # FHIR resource schemas
    |   |   |   |-- rag.py           # RAG interaction models
    |   |   |
    |   |   |-- services/            # Business logic
    |   |   |   |-- auth_service.py  # Authentication service
    |   |   |   |-- terminology_service.py # Terminology management
    |   |   |   |-- fhir_service.py  # FHIR operations
    |   |   |   |-- rag_service.py   # RAG AI assistant
    |   |   |   |-- audit_service.py # Audit logging with hash chains
    |   |   |   |-- icd_sync_service.py # WHO ICD-11 sync
    |   |   |   |-- qr_service.py    # QR code generation
    |   |   |
    |   |   |-- deps.py              # FastAPI dependencies
    |   |   |-- database.py          # Database configuration
    |   |
    |   |-- rag/                     # RAG knowledge base
    |   |   |-- knowledge_base/      # Source documents
    |   |   |   |-- namaste_descriptions.txt
    |   |   |   |-- ayurveda_classics.txt
    |   |   |   |-- siddha_medicine.txt
    |   |   |   |-- icd11_tm2_chapter26.txt
    |   |   |   |-- drug_safety_rules.txt
    |   |   |   |-- dosha_theory.txt
    |   |   |-- index_knowledge.py    # ChromaDB indexing
    |   |
    |   |-- data/                    # Seed data
    |   |   |-- seed.py              # Database seeding script
    |   |   |-- migrations/          # Alembic migrations
    |
    |-- frontend/                    # Next.js 15 frontend
    |   |-- package.json             # Node.js dependencies
    |   |-- Dockerfile               # Frontend container
    |   |-- next.config.js           # Next.js 15 configuration
    |   |-- tailwind.config.js       # Tailwind CSS config
    |   |-- tsconfig.json            # TypeScript configuration
    |
    |   |-- app/                     # App Router pages
    |   |   |-- layout.tsx           # Root layout with providers
    |   |   |-- page.tsx             # Landing page
    |   |   |-- login/               # Authentication pages
    |   |   |   |-- page.tsx        # Login with face auth
    |   |   |-- dashboard/           # Dashboard with real-time stats
    |   |   |-- offline/             # Offline status page
    |   |   |-- globals.css          # Global styles
    |
    |   |-- components/              # Reusable components
    |   |   |-- DiagnosisSearch.tsx  # Dual-coded diagnosis search
    |   |   |-- PatientIDCard.tsx    # Patient ID with ABHA
    |   |   |-- RAGChatWidget.tsx    # AI medical assistant
    |   |   |-- FaceAuth.tsx         # Face authentication
    |   |   |-- IndiaMap.tsx         # Healthcare analytics
    |
    |   |-- contexts/                # React contexts
    |   |   |-- auth-context.tsx     # Authentication state
    |   |   |-- theme-context.tsx    # Theme management
    |
    |   |-- lib/                     # Utility libraries
    |   |   |-- i18n.ts              # Internationalization (EN/TA/HI)
    |   |   |-- theme.ts             # Theme configuration
    |   |   |-- db.ts                # IndexedDB with Dexie.js
    |   |   |-- offline.ts          # Offline functionality
    |
    |   |-- public/                  # Static assets
    |   |   |-- manifest.json        # PWA manifest
    |   |   |-- sw.js                # Service worker
    |   |   |-- icons/               # PWA icons
```

---

## **Getting Started**

### **Prerequisites**
- Docker & Docker Compose (recommended for production)
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### **Quick Start with Docker**

1. **Clone the repository**
```bash
git clone https://github.com/your-org/tulsihealth.git
cd tulsihealth
```

2. **Start all services**
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

3. **Initialize the database**
```bash
# Run database migrations and seed data
docker-compose exec backend python -m alembic upgrade head
docker-compose exec backend python data/seed.py

# Index RAG knowledge base
docker-compose exec backend python rag/index_knowledge.py
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- ChromaDB: http://localhost:8000/chroma (for debugging)

### **Development Setup**

#### **Backend Development**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
python -m alembic upgrade head

# Seed the database
python data/seed.py

# Index knowledge base
python rag/index_knowledge.py

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### **Frontend Development**
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### **Service Dependencies**

The following services must be running:

- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **ChromaDB**: Vector embeddings (port 8000)
- **Backend**: FastAPI application (port 8000)
- **Frontend**: Next.js application (port 3000)
- **Nginx**: Reverse proxy (port 80/443)

### **Environment Variables**

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tulsihealth
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=RS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ABHA Integration
ABHA_CLIENT_ID=your-abha-client-id
ABHA_CLIENT_SECRET=your-abha-client-secret
ABHA_BASE_URL=https://dev.abdm.gov.in

# WHO ICD-11 API
WHO_ICD_API_BASE_URL=https://id.who.int
WHO_ICD_API_VERSION=v2

# AI/ML
FACE_RECOGNITION_TOLERANCE=0.6
CHROMA_DB_PATH=./chroma_db
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# PWA Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

# Feature Flags
NEXT_PUBLIC_ENABLE_FACE_AUTH=true
NEXT_PUBLIC_ENABLE_RAG_CHAT=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

---

## **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Username/password login
- `POST /api/auth/face-login` - Face recognition login
- `POST /api/auth/register-face` - Register face for biometric login

### **Terminology Endpoints**
- `GET /api/codes/suggest?q={query}&lang={en|ta|hi}` - Code suggestions
- `POST /api/codes/translate` - Bidirectional translation
- `GET /api/codes/icd11/{linearization}/{code}` - ICD-11 entity proxy
- `GET /api/codes/valueset/expand?url={}` - ValueSet expansion

### **Patient Endpoints**
- `POST /api/patients/` - Create patient
- `GET /api/patients/` - List patients (role-based)
- `GET /api/patients/{id}` - Get patient details
- `POST /api/patients/scan-qr` - Scan patient QR code

### **FHIR Endpoints**
- `POST /api/fhir/bundle/upload` - Upload FHIR Bundle
- `GET /api/fhir/Patient/{id}` - Get FHIR Patient
- `GET /api/fhir/Condition/{id}` - Get FHIR Condition
- `GET /api/fhir/CodeSystem` - List CodeSystems

### **AI/ML Endpoints**
- `POST /api/ml/extract-symptoms` - Extract symptoms from text
- `POST /api/ml/predict-recovery` - Predict recovery risk
- `POST /api/ml/recommend-medicines` - Get AYUSH medicine recommendations

---

## **Sample Data**

### **NAMASTE Codes**
The system includes 20 seed NAMASTE codes covering:
- **Fevers**: Vataja/Pittaja/Kaphaja Jwara
- **Metabolic**: Prameha/Madhumeha (Diabetes)
- **Cardiac**: Hrudayam/Hridroga
- **Musculoskeletal**: Sandhivata (Osteoarthritis)
- **GI**: Arshas (Hemorrhoids), Grahani (IBS)
- **Neurological**: Shiroroga (Headache)

### **Mock Users**
- **Dr. Ramesh** (doctor) - BAMS, MD Ayurveda
- **Priya** (clinician) - Healthcare worker
- **Rajan** (patient) - Sample patient with full history

---

## **Security & Compliance**

### **Security Features**
- **OAuth 2.0 + JWT**: Secure authentication
- **Face Recognition**: Biometric login with consent
- **Encrypted QR Codes**: Secure patient data sharing
- **Role-Based Access Control**: ISO 22600 compliant
- **Immutable Audit Trail**: SHA-256 hash chain
- **Data Encryption**: WebCrypto API for client-side encryption

### **Compliance**
- **FHIR R4**: Full HL7 FHIR compliance
- **ICD-11**: WHO standard coding
- **ABHA**: NDHM integration
- **India EHR 2016**: National EHR standards
- **ISO 22600**: Attribute-based access control
- **GDPR-like**: Patient consent management

---

## **AI/ML Capabilities**

### **Symptom Extraction**
- **Languages**: English, Tamil, Hindi
- **Technology**: Keyword matching + ML classification
- **Output**: NAMASTE candidate codes with confidence scores

### **Recovery Prediction**
- **Model**: Random Forest classifier
- **Features**: Age, chronic conditions, severity, medications
- **Output**: Risk score + recommendations

### **Medicine Recommendations**
- **Database**: 50+ AYUSH formulations
- **Safety**: Contraindication checking
- **Factors**: Age, pregnancy, cardiac history, current meds

---

## **Offline Architecture**

### **PWA Features**
- **Service Worker**: Background sync
- **IndexedDB**: Local patient summaries
- **WebCrypto**: Encrypted local storage
- **Sync Strategy**: Conflict resolution with server

### **Offline Capabilities**
- **Patient Search**: Local patient lookup
- **Encounter Creation**: Offline data capture
- **QR Scanning**: Cross-hospital access
- **Sync Indicator**: Real-time sync status

---

## **Multilingual Support**

### **Supported Languages**
- **English**: Primary interface
- **Tamil**: Regional language support
- **Hindi**: National language support

### **Implementation**
- **i18next**: Internationalization framework
- **Dynamic Loading**: Language-specific components
- **Medical Terminology**: Multilingual NAMASTE codes
- **UI Elements**: Translated interface components

---

## **Deployment**

### **Production Deployment**
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/tulsihealth
REDIS_URL=redis://host:6379

# Security
SECRET_KEY=your-super-secret-key
ABHA_CLIENT_ID=your-abha-client-id
ABHA_CLIENT_SECRET=your-abha-client-secret

# AI/ML
FACE_RECOGNITION_TOLERANCE=0.6
ML_MODEL_PATH=/app/models
```

---

## **Monitoring & Observability**

### **Health Checks**
- `/health` - Application health
- `/api/health` - API health
- Database connectivity checks
- Redis connectivity checks

### **Audit Trail**
- Complete audit logging
- Hash chain validation
- Compliance reporting
- User activity tracking

---

## **Contributing**

### **Development Guidelines**
1. Follow PEP 8 for Python code
2. Use TypeScript for frontend
3. Write comprehensive tests
4. Update documentation
5. Follow security best practices

### **Code Quality**
- **Backend**: Black, isort, flake8
- **Frontend**: ESLint, Prettier
- **Testing**: pytest, Jest
- **Pre-commit**: Automated code formatting

---

## **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## **Acknowledgments**

- **Ministry of Ayush**: For terminology standards
- **WHO**: For ICD-11 API access
- **NDHM**: For ABHA integration guidelines
- **HL7**: For FHIR standards
- **Open Source Community**: For amazing libraries

---

## **Contact**

- **Project Lead**: Abishek R
- **Organization**: SmartAI Studio
- **Email**: contact@tulsihealth.in
- **Website**: https://tulsihealth.in

---

## **Future Roadmap**

### **Phase 2 Features**
- **Mobile Apps**: React Native applications
- **Telemedicine**: Video consultation integration
- **Blockchain**: Full blockchain audit trail
- **Advanced AI**: Deep learning models

### **Phase 3 Features**
- **Hospital Integration**: HIS/EMR system connectors
- **Research Platform**: Clinical trial management
- **Global Expansion**: Multi-country terminology support
- **IoT Integration**: Wearable device connectivity

---

**Built with passion for bridging traditional Indian medicine with modern healthcare standards.**

*© 2024 SmartAI Studio. All rights reserved.*
