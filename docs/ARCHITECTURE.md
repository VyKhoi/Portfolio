# System Architecture (Portfolio Project)

## 1. Overview
The Portfolio project is a modern, cloud-native application built using a **Microservices Architecture**. It serves as both a public portfolio showcasing skills/projects and a private admin dashboard for content management.

## 2. Component Diagram

```mermaid
graph TD
    Client[Browser / Client] -->|HTTPS| Gateway[YARP API Gateway :5000]
    
    subgraph Frontend
        React[React 19 + Vite + Tailwind v4]
    end
    Client -.->|HTTP :80| React
    
    subgraph API Gateway
        Gateway
    end

    subgraph Microservices .NET 9
        Gateway -->|/identity| IdentityAPI[Identity Service]
        Gateway -->|/api/content| ContentAPI[Content Service]
        Gateway -->|/api/contact| ContactAPI[Contact Service]
    end

    subgraph Databases & Cache
        IdentityAPI -->|EF Core| ID_DB[(IdentityDb - Postgres)]
        ContentAPI -->|EF Core| CT_DB[(ContentDb - Postgres)]
        ContactAPI -->|EF Core| CC_DB[(ContactDb - Postgres)]
        ContentAPI -->|Cache| Redis[(Redis Stack)]
        ContentAPI -->|Images| MinIO[(MinIO S3)]
    end

    subgraph Event Bus
        ContactAPI -->|Produce: contact_submitted| Kafka{Apache Kafka}
    end

    subgraph Background Workers
        Worker[Notification Worker]
        Kafka -->|Consume| Worker
        Worker -->|Send Email| Mailpit[MailKit / Mailpit]
        Worker -->|Real-time| SignalR[SignalR Hub]
        Worker -->|Schedule| Hangfire[(HangfireDb - Postgres)]
    end

    subgraph Observability
        IdentityAPI -.->|OTLP| OTEL[OpenTelemetry Collector]
        ContentAPI -.->|OTLP| OTEL
        ContactAPI -.->|OTLP| OTEL
        Gateway -.->|OTLP| OTEL
        Worker -.->|OTLP| OTEL
        
        OTEL -->|Traces| Jaeger[Jaeger]
        OTEL -->|Metrics| Prometheus[Prometheus]
        OTEL -->|Logs| Seq[Seq]
        Prometheus --> Grafana[Grafana Dashboards]
    end
```

## 3. Key Design Decisions
- **CQRS Pattern**: Used heavily in microservices via MediatR to separate Read and Write operations.
- **Database-per-Service**: Each microservice owns its PostgreSQL database (isolated schemas/databases) to prevent tight coupling.
- **Event-Driven**: Asynchronous tasks like sending emails are handled via Kafka to decouple the fast API responses from slow external dependencies.
