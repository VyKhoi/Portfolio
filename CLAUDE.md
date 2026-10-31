# Portfolio (dangvykhoi.com) — tóm tắt repo

Trang cá nhân của Đặng Vỹ Khôi: trang public (profile, kinh nghiệm, kỹ năng, liên hệ), admin console `/dashboard` để sửa nội dung, và chatbot AI local "Sigma Cat".

## Stack
.NET 9 Web API · PostgreSQL 16 (EF Core) · React 19 + Vite 8 + Tailwind 4 · Ollama `sigma-cat` (Qwen2.5 1.5B) · Docker Compose · Gmail SMTP + Telegram để thông báo.

## Bản đồ module
| Thư mục | Vai trò | Chi tiết |
| :--- | :--- | :--- |
| `src/Portfolio.API/` | Backend: Program.cs, Controllers (Auth, Content, Contact, AI), Services (JWT, email, Ollama, Telegram), Data/Entities/Migrations | `src/Portfolio.API/CLAUDE.md` |
| `src/Portfolio.AI/` | Knowledge markdown → `Modelfile` → model Ollama `sigma-cat` | `src/Portfolio.AI/CLAUDE.md` |
| `src/Web/frontend/` | SPA React (public + admin + chatbot) và nginx của container | `src/Web/frontend/CLAUDE.md` |
| `scripts/` | `generate-favicons.ps1`, `generate-small-images.ps1` (từ `logo.png`), `init-databases.sql`, `servers.json` cho pgAdmin | — |
| `docs/` | Tài liệu cho người: ARCHITECTURE, FRONTEND, DEV_GUIDE | — |

Luồng request: `Gateway nginx (repo WebServer) → host:18122 → portfolio_frontend (nginx) → /api/* → portfolio_backend:8080 → postgres / ollama`.

## Container (docker-compose.yml)
`portfolio_frontend` 18122→80 · `portfolio_backend` 5000→8080 · `portfolio_postgres` 5432 · `portfolio_ollama` (không publish port, volume external `ollama_models`) · `portfolio_pgadmin` 5050.

## Chạy & kiểm tra
```bash
docker compose up -d --build
dotnet build src/Portfolio.API
cd src/Web/frontend && npm run build && npm run lint
```

## Deploy
Push `main` = deploy production ngay (self-hosted runner: tạo `.env` từ GitHub Secrets → `compose down` → `build --no-cache` → `up -d` → `ollama create sigma-cat`). Hỏi Khôi trước khi push.

## Quy ước
- Repo **public**: không commit secret, `.env`, IP nhà, hay ghi chú về lỗ hổng chưa vá.
- Trả lời tiếng Việt; text hiển thị cho người dùng là tiếng Việt.
- File nháp để ở `../Zwork/`.
