# TulsiHealth Native Execution Script (Windows)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting TulsiHealth Backend natively..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

cd backend

# Setup Python Virtual Environment
if (!(Test-Path -Path ".\venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv venv
}

# Activate and Install
.\venv\Scripts\Activate.ps1
Write-Host "Installing dependencies..."
pip install -r requirements.txt

# Create Database and Seed
python -c "
from core.database import engine, Base
from api.models.database import * 
Base.metadata.create_all(bind=engine)
print('SQLite Database created.')
"

Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting TulsiHealth Frontend natively..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

cd ..\frontend
Write-Host "Installing NPM dependencies..."
npm install

Write-Host "Starting Next.js Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Platform started! Backend: http://localhost:8000, Frontend: http://localhost:3000" -ForegroundColor Yellow
