# System Architecture (Portfolio Project)

## 1. Overview
The Portfolio project is a high-performance, resource-efficient **Modular Monolith** application built with **.NET 9**, **React 19**, and an isolated **Local AI Engine (Ollama + Qwen2.5:1.5B)**.

## 2. Architecture Diagram

```mermaid
graph TD
    Client[Browser / Client] -->|HTTP :18122| React[React 19 Frontend + Nginx]
    Client -->|REST API :5000| Backend[Portfolio.API - .NET 9 Monolith]
    
    subgraph Backend_Internal [.NET 9 Modular Monolith]
        Backend --> Auth[Identity & JWT Auth]
        Backend --> Content[Content CMS & IMemoryCache]
        Backend --> Contact[Contact Inbox]
        Backend --> AIChat[AI Chat Proxy]
        Backend --> ChannelQueue[In-memory Channel Queue]
        ChannelQueue --> EmailWorker[Email Sender BackgroundService]
    end
    
    Backend -->|EF Core Npgsql| Postgres[(PostgreSQL: portfolio_db)]
    EmailWorker -.->|SMTP TLS| Gmail[Gmail SMTP]
    AIChat -.->|HTTP Internal| Ollama[Ollama Local: sigma-cat (src/Portfolio.AI)]
    AIChat -.->|Webhook| Telegram[Telegram Bot Alerts]
```

## 3. Key Architectural Decisions
- **Modular Monolith**: Consolidated from microservices into a single, highly cohesive .NET 9 API to minimize overhead, eliminating redundant network hops and container sprawl.
- **Dedicated AI Project (`src/Portfolio.AI`)**: Encapsulates all knowledge markdown files, guidelines, and Ollama `Modelfile` into a dedicated project. The custom model `sigma-cat` is baked directly into Ollama, keeping the .NET Backend 100% free of hardcoded prompt strings.
- **In-Memory Caching (`IMemoryCache`)**: Provides sub-millisecond response times for portfolio profiles, skills, experiences, and projects with <2MB memory footprint.
- **In-Memory Channels (`System.Threading.Channels`)**: Decouples contact form submission from email delivery, replacing heavy Kafka infrastructure with lightweight native C# thread-safe channels.
- **Isolated Local AI**: Runs Ollama with custom model `sigma-cat` exclusively within the internal Docker network (no public ports), providing zero-cost, private, and sub-4s responses on laptop CPUs.
- **Single PostgreSQL Database**: Unified schema in `portfolio_db` with automatic migrations and data seeding on startup.
