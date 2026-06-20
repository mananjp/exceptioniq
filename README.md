# ExceptionIQ Monorepo

Free-tier-first implementation scaffold for ExceptionIQ.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Django + DRF
- AI Service: FastAPI
- Database: PostgreSQL
- Task Queue: Celery with Django DB backend
- Containers: Docker Compose

## Services
- backend: Django monolith with modular apps
- ai_service: FastAPI service for document and AI endpoints
- frontend: React app

## Run
```bash
docker compose up --build
```
