# Developer Guide

Welcome to the Portfolio project! This guide will help developers spin up, develop, and contribute to the streamlined architecture.

## 1. Prerequisites
- Docker & Docker Compose
- .NET 9 SDK
- Node.js v20+

## 2. Architecture Overview
The system runs lightweight Docker containers:
1. **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS (`portfolio_frontend`, port `18122 -> 80`)
2. **Backend**: .NET 9 Modular Monolith Web API (`portfolio_backend`, port nội bộ `8080`, không publish)
3. **Database**: PostgreSQL 16 Alpine (`portfolio_postgres`, `127.0.0.1:5432`)
4. **Database UI**: pgAdmin 4 (`portfolio_pgadmin`, `127.0.0.1:5050`, chỉ chạy với `--profile tools`)
5. **Local AI**: Ollama running custom `sigma-cat` model (`portfolio_ollama`, internal network only, CPU-optimized)

Total memory footprint: ~1.5 GB RAM.

## 3. Running the System Locally

The easiest way to run the entire system is via Docker Compose:

```bash
# Ensure .env is present
cp .env.example .env

# Build and start services in detached mode
docker compose up --build -d
```

### Access Points
- **Frontend**: `http://localhost:18122`
- **Backend API**: qua frontend `http://localhost:18122/api/...`; chạy `dotnet run` thì `http://localhost:5000/openapi/v1.json`
- **pgAdmin 4**: `docker compose --profile tools up -d pgadmin` → `http://127.0.0.1:5050`
- **PostgreSQL**: `127.0.0.1:5432` (db: `portfolio_db`, user: `postgres`)

## 4. Development Workflow

### Backend (`src/Portfolio.API`)
- Run outside Docker during development:
  ```bash
  cd src/Portfolio.API
  dotnet run
  ```
- EF Core Migrations:
  ```bash
  dotnet ef migrations add <MigrationName> --project src/Portfolio.API
  dotnet ef database update --project src/Portfolio.API
  ```

### Frontend (`src/Web/frontend`)
- Run with fast Hot Module Replacement (HMR):
  ```bash
  cd src/Web/frontend
  npm install
  npm run dev
  ```
- Build production bundle:
  ```bash
  npm run build
  ```

### Local AI Model (Ollama)
- The Ollama container is internal-only to prevent public spam and abuse.
- In development, pulling or updating the model:
  ```bash
  docker exec -it portfolio_ollama ollama pull qwen2.5:1.5b
  ```
