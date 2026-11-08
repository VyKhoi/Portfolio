<div align="center">

# Đặng Vỹ Khôi (Dang Vy Khoi) — Portfolio

**Software Engineer (.NET Backend)**

[![Website](https://img.shields.io/badge/dangvykhoi.com-00DC82?style=for-the-badge&logo=google-chrome&logoColor=white)](https://dangvykhoi.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-vykhoi-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/vykhoi)
[![GitHub](https://img.shields.io/badge/GitHub-vykhoi-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vykhoi)

`.NET 9` · `PostgreSQL 16` · `React 19` · `TypeScript` · `Tailwind` · `Ollama (Qwen3)` · `Docker` · `Nginx`

</div>

A personal website self-hosted on a home server: a public profile, an admin console for editing the content, and **Sigma Cat** 😼, an AI assistant that runs locally.

| Home | Sigma Cat AI assistant | Admin dashboard |
| :---: | :---: | :---: |
| ![Home](docs/images/home.png) | ![Chat](docs/images/chat.png) | ![Admin](docs/images/admin.png) |

## Architecture

```mermaid
graph LR
    U["Browser"] -->|"HTTPS"| CF["Cloudflare"]
    CF --> GW["Nginx gateway"]
    GW --> FE["Frontend: React 19 + Nginx"]
    FE -->|"/api"| BE["Backend: .NET 9 API"]
    BE --> DB[("PostgreSQL 16")]
    BE --> AI["Ollama: Qwen3 4B"]
    BE -.-> N["Gmail / Telegram"]
```

- **Backend:** .NET 9 modular monolith, EF Core, JWT, in-memory cache, background email through `System.Threading.Channels`.
- **AI:** Sigma Cat is Khoi's assistant with its own personality, on Ollama + Qwen3 4B (CPU + GPU), reachable only inside the Docker network. Its prompt is built from the live database, and every reply is generated and streamed over SSE. It speaks English and Vietnamese.
- **Frontend:** React 19, Vite, Tailwind, Framer Motion; SEO with JSON-LD, OpenGraph and a sitemap.
- **Protection:** rate limits, a honeypot against bots (no captcha), secrets managed on the server.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DEV_GUIDE.md](docs/DEV_GUIDE.md)

## Run it locally

```bash
git clone https://github.com/vykhoi/Portfolio.git && cd Portfolio
cp .env.example .env
docker volume create ollama_models
docker compose up -d --build
docker exec portfolio_ollama ollama pull qwen3:4b-instruct
```

Open http://localhost:18122. pgAdmin (optional): `docker compose --profile tools up -d pgadmin` → http://127.0.0.1:5050.

## Contact

📧 [dangvykhoi@gmail.com](mailto:dangvykhoi@gmail.com) · 🌐 [dangvykhoi.com](https://dangvykhoi.com) · 💼 [linkedin.com/in/vykhoi](https://linkedin.com/in/vykhoi)
