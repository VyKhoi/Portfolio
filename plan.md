# KẾ HOẠCH HỆ THỐNG PORTFOLIO MICROSERVICES - PHIÊN BẢN NÂNG CẤP 2.0
> **Mục tiêu**: Build một hệ thống full-stack production-grade để học và dùng làm portfolio cá nhân thực sự.
> **Triết lý**: Đề tài đơn giản (Portfolio) nhưng kiến trúc & công nghệ phức tạp – mọi kỹ sư senior đều muốn thấy.

---

## 1. TỔNG QUAN KIẾN TRÚC (v2.0)

```
                    ┌─────────────────────────────────────────┐
                    │         EXTERNAL WORLD                   │
                    │  Browser / Mobile / API Consumer         │
                    └─────────────────┬───────────────────────┘
                                      │ HTTPS
                    ┌─────────────────▼───────────────────────┐
                    │         NGINX (TLS Termination)          │
                    │         + Rate Limiting (L4/L7)          │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │    YARP API GATEWAY (ASP.NET Core)       │
                    │  - JWT Validation Middleware             │
                    │  - Rate Limiting (Token Bucket)          │
                    │  - Request Aggregation                   │
                    │  - OpenTelemetry Tracing                 │
                    └──────┬──────────┬───────────┬───────────┘
                           │          │           │
              ┌────────────▼──┐  ┌────▼────┐  ┌──▼──────────┐
              │Identity.Svc   │  │Content  │  │Contact.Svc  │
              │(ASP.NET Core) │  │.Svc     │  │(ASP.NET)    │
              │- JWT Issuer   │  │(ASP.NET)│  │- Kafka Pub  │
              │- Refresh Token│  │- Redis  │  │- CQRS       │
              │- OAuth2/OIDC  │  │- Cache  │  └──────┬──────┘
              └───────┬───────┘  │- CQRS   │         │
                      │          │- MinIO  │         │ Kafka Event
              ┌───────▼───────┐  └────┬────┘  ┌──────▼──────┐
              │  identity_db  │       │        │Notification │
              │  (PostgreSQL) │  ┌────▼────┐   │.Worker      │
              └───────────────┘  │content  │   │- MailKit    │
                                 │_db (PG) │   │- SignalR Hub│
                                 └─────────┘   └─────────────┘
                                      │
                          ┌───────────▼──────────┐
                          │  MinIO Object Storage │
                          │  (S3-compatible)      │
                          └──────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │                  OBSERVABILITY STACK                         │
  │  OpenTelemetry Collector → Jaeger (Tracing)                  │
  │  Prometheus → Grafana (Metrics + Dashboards)                 │
  │  Seq / Loki (Structured Logs)                               │
  └─────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │                  FRONTEND (React + Vite)                     │
  │  - React Query (Server State)                               │
  │  - Zustand (Client State)                                   │
  │  - Framer Motion (Animations)                               │
  │  - shadcn/ui + Tailwind CSS                                 │
  │  - SignalR Client (Real-time notifications)                 │
  │  - PWA support (Workbox)                                    │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. STACK CÔNG NGHỆ ĐẦY ĐỦ

### 2.1 Backend Services (.NET 9)

| Component | Technology | Lý do chọn |
|---|---|---|
| API Gateway | ASP.NET Core + YARP | Reverse Proxy thuần .NET, cực kỳ performant |
| Auth | ASP.NET Core + JWT + Refresh Token | Stateless auth, production-ready |
| ORM | EF Core 9 (Code-First) | Migrations tự động, LINQ mạnh |
| Database | **PostgreSQL 16** (thay MySQL) | JSONB, Full-text search, Row-Level Security |
| Cache | Redis Stack (RedisJSON + RediSearch) | Caching + Search trong một tool |
| Message Bus | Apache Kafka (KRaft mode) | Event-driven, durable, replayable |
| Object Storage | **MinIO** (S3-compatible) | Lưu ảnh/CV, học S3 API pattern |
| Real-time | **SignalR** (ASP.NET Core) | Push notifications khi có contact mới |
| Email | **MailKit** + SMTP / Resend API | Gửi email thật, không chỉ mock |
| Background Job | **Hangfire** (trên PostgreSQL) | Scheduled jobs, retry, dashboard |
| Validation | FluentValidation | Validation mạnh, readable |
| Logging | **Serilog** → Seq | Structured logs, query được |
| Tracing | **OpenTelemetry** → Jaeger | Distributed tracing, debug microservices |
| Metrics | OpenTelemetry → Prometheus | Performance metrics |
| API Docs | **Scalar** (thay Swagger UI) | Modern API docs, đẹp hơn Swagger |
| Architecture | **CQRS + MediatR** | Tách read/write, clean code |
| Health Check | ASP.NET HealthChecks + UI | Monitor toàn bộ services |

### 2.2 Frontend (React 19 + Vite 6)

| Component | Technology | Lý do chọn |
|---|---|---|
| Framework | React 19 + Vite 6 | Bleeding-edge, React Compiler |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first + headless components |
| Animation | **Framer Motion** | Smooth animations, drag-and-drop |
| State (Server) | **TanStack Query v5** | Server state, caching, optimistic updates |
| State (Client) | **Zustand** | Lightweight global state |
| Real-time | **SignalR JS Client** | Nhận notification từ server |
| Form | **React Hook Form** + Zod | Type-safe forms, validation |
| 3D / WebGL | **Three.js** / React Three Fiber | Hero section 3D particles / globe |
| Charts | **Recharts** | Biểu đồ skills, tech usage |
| PWA | **Vite PWA Plugin** (Workbox) | Offline support, installable |
| Testing | **Vitest** + React Testing Library | Unit & integration tests |
| E2E | **Playwright** | Browser automation tests |

### 2.3 Infrastructure & DevOps

| Component | Technology | Lý do chọn |
|---|---|---|
| Containerization | Docker + Docker Compose v2 | Chạy toàn bộ stack 1 lệnh |
| Reverse Proxy | **Nginx** | TLS termination, serve static files |
| Observability | **Grafana + Prometheus + Jaeger** | Full observability stack |
| Structured Logging | **Seq** | Query logs như SQL |
| CI/CD | **GitHub Actions** | Build, test, lint tự động |
| Secret Management | Docker Secrets / `.env` | Không hardcode credentials |
| DB Migrations | EF Core Migrations (auto apply) | Code-first, reproducible |

---

## 3. CẤU TRÚC THƯ MỤC (MONOREPO)

```
Portfolio/
├── docker-compose.yml              ← Main compose file
├── docker-compose.override.yml     ← Local dev overrides
├── docker-compose.monitoring.yml   ← Observability stack
├── .env.example                    ← Template biến môi trường
├── nginx/
│   ├── nginx.conf
│   └── certs/                      ← TLS certs (mkcert cho local)
│
├── scripts/
│   ├── init-databases.sql          ← Tạo 3 PostgreSQL DBs
│   └── seed-data.sql               ← Data mẫu
│
├── src/
│   ├── Services/
│   │   ├── Gateway.API/            ← YARP Gateway
│   │   │   ├── Middleware/         ← Auth validation, logging
│   │   │   ├── appsettings.json
│   │   │   └── Dockerfile
│   │   │
│   │   ├── Identity.Service/
│   │   │   ├── Domain/             ← User entity, value objects
│   │   │   ├── Application/        ← CQRS Commands/Queries (MediatR)
│   │   │   │   ├── Commands/       ← Login, Register, RefreshToken
│   │   │   │   └── Queries/
│   │   │   ├── Infrastructure/     ← IdentityDbContext, JWT, migrations
│   │   │   └── API/                ← Controllers, Program.cs
│   │   │
│   │   ├── Content.Service/
│   │   │   ├── Domain/             ← Project, Skill, Profile entities
│   │   │   ├── Application/        ← CQRS + MediatR
│   │   │   │   ├── Commands/       ← CreateProject, UpdateSkill...
│   │   │   │   └── Queries/        ← GetProjects, GetProfile...
│   │   │   ├── Infrastructure/     ← ContentDbContext, Redis, MinIO
│   │   │   └── API/                ← Controllers, Program.cs
│   │   │
│   │   └── Contact.Service/
│   │       ├── Domain/
│   │       ├── Application/        ← CQRS + Kafka Producer
│   │       ├── Infrastructure/     ← ContactDbContext, KafkaProducer
│   │       └── API/
│   │
│   └── Workers/
│       └── Notification.Worker/    ← Kafka Consumer + SignalR Hub
│           ├── BackgroundServices/
│           ├── Hubs/               ← SignalR Hub
│           └── EmailServices/      ← MailKit
│
└── frontend/                       ← React + Vite app
    ├── src/
    │   ├── components/
    │   │   ├── ui/                 ← shadcn/ui components
    │   │   ├── layout/
    │   │   └── three/              ← React Three Fiber scenes
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Projects.tsx
    │   │   ├── About.tsx
    │   │   └── admin/              ← Admin dashboard
    │   ├── hooks/                  ← Custom hooks
    │   ├── stores/                 ← Zustand stores
    │   ├── services/               ← API client (Axios / ky)
    │   └── lib/                    ← Utilities, helpers
    └── Dockerfile
```

---

## 4. THIẾT KẾ DỮ LIỆU (PostgreSQL - Database per Service)

### A. identity_db

```sql
Users:          Id (UUID), Username, PasswordHash, Email, Role, RefreshToken, RefreshTokenExpiry, CreatedAt
AuditLogs:      Id, UserId, Action, IpAddress, CreatedAt    ← Thêm mới
```

### B. content_db

```sql
Projects:       Id (UUID), Title, Slug, Summary, DescriptionMdx (TEXT),
                CoverImageKey (MinIO), TechStack (JSONB), DemoUrl, GithubUrl,
                Order, IsFeatured, Status (Draft/Published), ViewCount, CreatedAt

Skills:         Id (UUID), Name, Category, IconSvgKey (MinIO), ProficiencyLevel (1-100), Order

Profile:        Id (UUID), FullName, Title, Bio, AvatarKey (MinIO), CvPdfKey (MinIO),
                GithubLink, LinkedinLink, TwitterLink, MetaDescription, OgImageKey

BlogPosts:      Id (UUID), Title, Slug, ContentMdx, CoverImageKey, Tags (JSONB),
                Status, PublishedAt, ReadTimeMinutes    ← Thêm mới: Blog đơn giản

PageViews:      Id, Path, UserAgent, Ip (hashed), VisitedAt    ← Analytics đơn giản
```

### C. contact_db

```sql
ContactMessages: Id (UUID), SenderName, SenderEmail, Subject, Content,
                 IsRead, IsReplied, Tags, CreatedAt

NotificationEvents: Id, MessageId, EventType, SentAt, IsSuccess   ← Audit trail
```

---

## 5. CÁC TÍNH NĂNG NỔI BẬT (FEATURES)

### 5.1 Public Portfolio Site
- **Hero Section**: Three.js particle animation / interactive 3D globe
- **Projects**: Filter theo tech stack, sort, search (Redis Search)
- **Skills**: Animated progress bars (Framer Motion) + radar chart
- **Blog**: Markdown/MDX rendered, reading time, syntax highlighting
- **Contact Form**: Form → Contact.Service → Kafka → Email thật (MailKit)
- **PWA**: Cài được như app, offline cache trang chủ
- **Dark/Light Mode**: System preference + manual toggle

### 5.2 Admin Dashboard
- **Login**: JWT + Refresh Token flow
- **Projects CRUD**: Rich text editor (TipTap), upload ảnh lên MinIO
- **Contact Inbox**: Xem tin nhắn, đánh dấu đã đọc, real-time badge (SignalR)
- **Analytics**: Biểu đồ lượt xem theo ngày/tháng (Recharts)
- **Hangfire Dashboard**: Monitor background jobs
- **Health Dashboard**: Trạng thái tất cả services (ASP.NET HealthChecks UI)

### 5.3 Observability (The "Wow" Factor)
- **Distributed Tracing**: Trace 1 request qua Gateway → Content.Service → Redis → DB (Jaeger)
- **Metrics Dashboard**: Grafana dashboard theo dõi RPS, latency, error rate, DB pool
- **Structured Logs**: Serilog → Seq, query log như SQL
- **Alerts**: Prometheus AlertManager gửi email/webhook khi service down

---

## 6. DOCKER COMPOSE - CẤU HÌNH ĐẦY ĐỦ

```yaml
# docker-compose.yml
version: '3.9'

networks:
  portfolio_net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  grafana_data:
  prometheus_data:
  seq_data:

services:
  # ─── INFRASTRUCTURE ─────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: portfolio_postgres
    networks: [portfolio_net]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_MULTIPLE_DATABASES: identity_db,content_db,contact_db
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis/redis-stack:latest   # Includes RedisJSON + RediSearch
    container_name: portfolio_redis
    networks: [portfolio_net]
    ports: ["6379:6379", "8001:8001"]  # 8001 = RedisInsight UI
    volumes: [redis_data:/data]

  kafka:
    image: bitnami/kafka:3.7
    container_name: portfolio_kafka
    networks: [portfolio_net]
    ports: ["9092:9092"]
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER

  kafka_ui:
    image: provectuslabs/kafka-ui:latest
    container_name: portfolio_kafka_ui
    networks: [portfolio_net]
    ports: ["8080:8080"]
    environment:
      - KAFKA_CLUSTERS_0_NAME=portfolio
      - KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092
    depends_on: [kafka]

  minio:
    image: minio/minio:latest
    container_name: portfolio_minio
    networks: [portfolio_net]
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    volumes: [minio_data:/data]

  # ─── MICROSERVICES ──────────────────────────────────────────
  identity_service:
    build: { context: ., dockerfile: src/Services/Identity.Service/API/Dockerfile }
    networks: [portfolio_net]
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=identity_db;Username=postgres;Password=${POSTGRES_PASSWORD}
      - JwtSettings__Secret=${JWT_SECRET}
    depends_on:
      postgres: { condition: service_healthy }

  content_service:
    build: { context: ., dockerfile: src/Services/Content.Service/API/Dockerfile }
    networks: [portfolio_net]
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=content_db;Username=postgres;Password=${POSTGRES_PASSWORD}
      - Redis__ConnectionString=redis:6379
      - MinIO__Endpoint=minio:9000
      - MinIO__AccessKey=${MINIO_ROOT_USER}
      - MinIO__SecretKey=${MINIO_ROOT_PASSWORD}
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_started }
      minio:    { condition: service_started }

  contact_service:
    build: { context: ., dockerfile: src/Services/Contact.Service/API/Dockerfile }
    networks: [portfolio_net]
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=contact_db;Username=postgres;Password=${POSTGRES_PASSWORD}
      - Kafka__BootstrapServers=kafka:9092
    depends_on:
      postgres: { condition: service_healthy }
      kafka:    { condition: service_started }

  notification_worker:
    build: { context: ., dockerfile: src/Workers/Notification.Worker/Dockerfile }
    networks: [portfolio_net]
    environment:
      - Kafka__BootstrapServers=kafka:9092
      - Email__SmtpHost=${SMTP_HOST}
      - Email__SmtpUser=${SMTP_USER}
      - Email__SmtpPass=${SMTP_PASS}
    depends_on: [kafka]

  api_gateway:
    build: { context: ., dockerfile: src/Services/Gateway.API/Dockerfile }
    networks: [portfolio_net]
    ports: ["5000:80"]
    depends_on: [identity_service, content_service, contact_service]

  frontend_ui:
    build: { context: ./frontend, dockerfile: Dockerfile }
    networks: [portfolio_net]
    ports: ["3000:80"]
    depends_on: [api_gateway]

  # ─── OBSERVABILITY ──────────────────────────────────────────
  otel_collector:
    image: otel/opentelemetry-collector-contrib:latest
    container_name: portfolio_otel
    networks: [portfolio_net]
    volumes: [./monitoring/otel-collector.yaml:/etc/otelcol-contrib/config.yaml]

  jaeger:
    image: jaegertracing/all-in-one:1.57
    container_name: portfolio_jaeger
    networks: [portfolio_net]
    ports: ["16686:16686"]  # Jaeger UI

  prometheus:
    image: prom/prometheus:latest
    container_name: portfolio_prometheus
    networks: [portfolio_net]
    ports: ["9090:9090"]
    volumes: [./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml, prometheus_data:/prometheus]

  grafana:
    image: grafana/grafana:latest
    container_name: portfolio_grafana
    networks: [portfolio_net]
    ports: ["3001:3000"]
    volumes: [grafana_data:/var/lib/grafana, ./monitoring/grafana/provisioning:/etc/grafana/provisioning]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

  seq:
    image: datalust/seq:latest
    container_name: portfolio_seq
    networks: [portfolio_net]
    ports: ["5341:5341", "8082:80"]
    volumes: [seq_data:/data]
    environment:
      - ACCEPT_EULA=Y
```

---

## 7. YARP GATEWAY - CẤU HÌNH NÂNG CAO

```json
{
  "ReverseProxy": {
    "Routes": {
      "identity-route":  { "ClusterId": "identity-cluster",  "Match": { "Path": "/api/auth/{**rest}" } },
      "content-route":   { "ClusterId": "content-cluster",   "Match": { "Path": "/api/content/{**rest}" } },
      "contact-route":   { "ClusterId": "contact-cluster",   "Match": { "Path": "/api/contact/{**rest}" } },
      "signalr-route":   { "ClusterId": "notify-cluster",    "Match": { "Path": "/hubs/{**rest}" } }
    },
    "Clusters": {
      "identity-cluster": {
        "Destinations": { "d1": { "Address": "http://identity_service:80/" } }
      },
      "content-cluster": {
        "LoadBalancingPolicy": "RoundRobin",
        "Destinations": {
          "d1": { "Address": "http://content_service:80/" }
        },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/healthz" }
        }
      },
      "contact-cluster": {
        "Destinations": { "d1": { "Address": "http://contact_service:80/" } }
      },
      "notify-cluster": {
        "Destinations": { "d1": { "Address": "http://notification_worker:80/" } }
      }
    }
  }
}
```

---

## 8. CÔNG NGHỆ MỚI ĐÃ THÊM VÀO (SO VỚI PLAN CŨ)

| # | Công nghệ | Lý do thêm |
|---|---|---|
| 1 | **PostgreSQL 16** (thay MySQL) | JSONB native, Row-Level Security, superior |
| 2 | **MinIO** (S3-compatible) | Upload ảnh, CV – học S3 API pattern |
| 3 | **SignalR** | Real-time notifications admin inbox |
| 4 | **CQRS + MediatR** | Clean architecture pattern chuẩn enterprise |
| 5 | **Hangfire** | Scheduled jobs, retry, monitor dashboard |
| 6 | **OpenTelemetry** | Distributed tracing production-ready |
| 7 | **Jaeger** | Visualize traces, debug microservices |
| 8 | **Grafana + Prometheus** | Metrics dashboard |
| 9 | **Seq** | Structured log querying |
| 10 | **Kafka UI** | Monitor Kafka topics/messages GUI |
| 11 | **Redis Stack** (RedisJSON + RediSearch) | Full-text search trong Redis |
| 12 | **MailKit** | Gửi email thật (không chỉ mock) |
| 13 | **Scalar** (thay Swagger UI) | Modern API docs |
| 14 | **FluentValidation** | Strong validation layer |
| 15 | **Three.js / R3F** | 3D hero section |
| 16 | **Framer Motion** | Micro-animations |
| 17 | **TanStack Query v5** | Advanced server state management |
| 18 | **Zustand** | Client state management |
| 19 | **PWA (Workbox)** | Offline support, installable |
| 20 | **Playwright** | E2E browser testing |
| 21 | **GitHub Actions CI/CD** | Automated pipeline |
| 22 | **Blog (MDX)** | Thêm tính năng blog cho portfolio |
| 23 | **Nginx** | TLS termination, layer trước gateway |
| 24 | **AuditLog** | Security tracking |
| 25 | **PageViews analytics** | Simple self-hosted analytics |

---

## 9. ROADMAP THỰC HIỆN

### Phase 1: Hạ Tầng Docker (Week 1)
- [ ] Tạo file `.env.example` với tất cả biến
- [ ] Viết `init-databases.sql` tạo 3 PostgreSQL DBs
- [ ] Spin up: PostgreSQL, Redis Stack, Kafka + Kafka UI, MinIO
- [ ] Spin up: Jaeger, Prometheus, Grafana, Seq
- [ ] Verify tất cả container healthy

### Phase 2: Backend Services (Week 2-3)
- [ ] **Identity.Service**: JWT + Refresh Token + AuditLog
- [ ] **Content.Service**: CQRS/MediatR + EF Core + Redis Cache + MinIO upload
- [ ] **Contact.Service**: CQRS + Kafka Producer
- [ ] **Notification.Worker**: Kafka Consumer + MailKit + SignalR Hub
- [ ] **Hangfire**: Scheduled job cleanup old messages

### Phase 3: YARP Gateway + Observability (Week 3)
- [ ] YARP routes + Rate Limiting + Health Check aggregation
- [ ] OpenTelemetry SDK trong tất cả services → Jaeger
- [ ] Prometheus scrape endpoints
- [ ] Grafana dashboards (.NET runtime + custom metrics)
- [ ] Serilog → Seq integration
- [ ] Scalar API docs

### Phase 4: Frontend (Week 4-5)
- [ ] Setup React 19 + Vite 6 + Tailwind v4 + shadcn/ui
- [ ] Three.js hero section
- [ ] Public pages: Home, Projects, Skills, Blog, Contact
- [ ] Admin dashboard: Login, Projects CRUD, Inbox (SignalR), Analytics
- [ ] PWA manifest + service worker
- [ ] Zustand auth store + TanStack Query

### Phase 5: Testing + CI/CD (Week 5-6)
- [ ] Unit tests: xUnit (.NET) + Vitest (React)
- [ ] Integration tests: EF Core InMemory / Testcontainers
- [ ] E2E tests: Playwright (login flow, contact form)
- [ ] GitHub Actions: build → test → lint → docker build
- [ ] `docker compose up --scale content_service=3` test Round-Robin

### Phase 6: Polish & Production-Ready (Week 6)
- [ ] Nginx config + mkcert TLS (local)
- [ ] Dockerfile multi-stage tối ưu (non-root user, .dockerignore)
- [ ] Environment secrets management
- [ ] README.md đẹp với architecture diagram
- [ ] Demo video recording

---

## 10. HƯỚNG BẮT ĐẦU NGAY

**Bước 1**: Tạo file `.env` từ `.env.example`  
**Bước 2**: Chạy `docker compose up -d postgres redis kafka minio` – kiểm tra hạ tầng  
**Bước 3**: Khởi tạo .NET Solution với tất cả project  
**Bước 4**: Code Identity.Service trước (auth là nền tảng)

> 💡 **Pro tip**: Dùng Testcontainers trong integration tests thay vì mock DB – test sát thực tế hơn nhiều.