# Developer Guide

Welcome to the Portfolio project! This guide will help AI agents and human developers spin up and contribute to the repository.

## 1. Prerequisites
- Docker & Docker Compose
- .NET 9 SDK
- Node.js v20+

## 2. Running the System Locally

The easiest way to run the entire system is via Docker Compose:

```bash
# Ensure .env is present
cp .env.example .env

# Build and start all services in detached mode
docker compose up --build -d
```

### Access Points
- **Frontend**: `http://localhost:80`
- **Gateway API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Kafka UI**: `http://localhost:8080`
- **Jaeger (Tracing)**: `http://localhost:16686`
- **Seq (Logs)**: `http://localhost:8082`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin / admin)
- **Mailpit (Local Email)**: `http://localhost:8025`

## 3. Development Workflow (AI Agents)

When an AI agent is tasked with adding a new feature, follow this flow:
1. **Understand Context**: Read `docs/ARCHITECTURE.md` and `plan.md`.
2. **Backend Changes**: 
   - Navigate to the specific service in `src/Services/`.
   - Update Entities and apply EF Core Migrations using `dotnet ef migrations add ...`.
   - Use MediatR for new commands/queries.
3. **Frontend Changes**:
   - Navigate to `src/Web/frontend`.
   - Use `npm run dev` to test locally outside of Docker for faster HMR (Hot Module Replacement).
4. **Testing**: Add or update tests in `src/Services/.../Tests/`. Run `dotnet test`.
5. **Re-deploy**: If infrastructure or Dockerfiles change, run `docker compose up --build -d` to refresh the stack.
