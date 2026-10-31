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
`portfolio_frontend` 18122→80 (cổng duy nhất gateway dùng) · `portfolio_backend` 8080 (không publish) · `portfolio_postgres` `127.0.0.1:5432` · `portfolio_ollama` (không publish, CPU giới hạn ½ số core qua `OLLAMA_CPUS`, volume external `ollama_models`) · `portfolio_pgadmin` chỉ chạy khi cần: `docker compose --profile tools up -d pgadmin` rồi SSH tunnel `127.0.0.1:5050`. Log mọi container xoay vòng 10MB×3.

## Bảo mật & chống spam (đừng làm mất khi sửa code)
- IP thật của khách đi qua: Cloudflare → gateway (realip) → `X-Real-IP` → nginx frontend (realip) → `X-Forwarded-For` → backend `UseForwardedHeaders`. Mọi quota dùng `HttpContext.Connection.RemoteIpAddress`.
- AI: quota 15 tin/10 phút/IP, `AiConcurrencyGate` tối đa 2 request Ollama cùng lúc (chờ 15s rồi trả câu "bận"), `sessionId` phải `[A-Za-z0-9-]{8,64}`.
- Contact: email hợp lệ, 3 tin/giờ/IP (429), tối đa 30 email/ngày (dư thì chỉ lưu inbox), hàng đợi giới hạn 100.
- Login: sai 5 lần/IP → khoá 15 phút (429). JWT 3 ngày, claim `pwd_ver` → đổi mật khẩu thu hồi token cũ.
- Telegram tối đa 30 tin/giờ, `parse_mode: HTML` → nội dung động phải qua `TelegramNotifier.Escape`.
- Chat log > 90 ngày tự xoá (`ChatRetentionWorker`). Backend chạy user non-root `app`.
- Thiếu `JwtSettings:Secret` hoặc connection string → app **dừng lúc khởi động** (secret < 32 ký tự chỉ cảnh báo trong log). Dev local dùng `appsettings.Development.json` + `launchSettings.json`.

## Chạy & kiểm tra
```bash
docker compose up -d --build
dotnet build src/Portfolio.API
cd src/Web/frontend && npm run build && npm run lint
```

## Deploy
Push `main` = deploy production ngay (self-hosted runner: `scripts/server-secrets.sh ensure` → tạo `.env` → **backup DB** `pg_dump` vào `~/backups/portfolio/` (giữ 14 bản, lỗi thì dừng deploy) → `compose build` → `up -d postgres` + `server-secrets.sh sync-db` → `up -d --remove-orphans` → `ollama create sigma-cat` → health check `localhost:18122`). Chỉ push khi Khôi nói "làm đi". Smoke test 2 domain: `bash ../Zwork/smoke.sh`.

**Secret:** mật khẩu Postgres và JWT secret **không nằm trên GitHub** — được sinh và lưu trên server tại `~/.config/portfolio/{postgres_password,jwt_secret}` (chmod 600). Muốn xoay: xoá file tương ứng trên server rồi deploy lại (xoay JWT = admin đăng nhập lại). GitHub Secrets chỉ còn `MAIL_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (và `ADMIN_PASSWORD` nếu muốn ép mật khẩu admin).

## Quy ước
- Repo **public**: không commit secret, `.env`, IP nhà, hay ghi chú về lỗ hổng chưa vá.
- Trả lời tiếng Việt; text hiển thị cho người dùng là tiếng Việt.
- File nháp để ở `../Zwork/`.
