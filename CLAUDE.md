# Portfolio (dangvykhoi.com) — tóm tắt repo

Trang cá nhân của Đặng Vỹ Khôi: trang public (profile, kỹ năng, dự án riêng + trang chi tiết, kinh nghiệm, Now, liên hệ), admin console `/dashboard` để sửa nội dung, và chatbot AI local "Sigma Cat".

## Stack
.NET 9 Web API · PostgreSQL 16 (EF Core) · React 19 + Vite 8 + Tailwind 4 · Ollama (Qwen3 4B) · Docker Compose · Gmail SMTP + Telegram để thông báo.

## Bản đồ module
| Thư mục | Vai trò | Chi tiết |
| :--- | :--- | :--- |
| `src/Portfolio.API/` | Backend: Program.cs, Controllers, Features/Chat (Sigma Cat), Services (JWT, email, Telegram), Data/Entities/Migrations | `src/Portfolio.API/CLAUDE.md` |
| `src/Portfolio.AI/` | Persona, thông báo hệ thống, bộ đánh giá Sigma Cat | `src/Portfolio.AI/CLAUDE.md` |
| `src/Web/frontend/` | SPA React (public + admin + chatbot) và nginx của container | `src/Web/frontend/CLAUDE.md` |
| `scripts/` | `generate-favicons.ps1`, `generate-small-images.ps1` (từ `logo.png`), `init-databases.sql`, `servers.json` cho pgAdmin | — |
| `database/updates/` | Script SQL đổi dữ liệu, CI tự chạy (xem mục dưới) | — |
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
- Backend chạy user non-root `app`.
- Thiếu `JwtSettings:Secret` hoặc connection string → app **dừng lúc khởi động** (secret < 32 ký tự chỉ cảnh báo trong log). Dev local dùng `appsettings.Development.json` + `launchSettings.json`.

## Luật dữ liệu cá nhân (Luật 91/2025, Luật AI 134/2025) — đừng làm mất
- Trang `/privacy` + `/vi/privacy` (`src/Web/frontend/src/content/privacy.ts`) hứa: chat giữ 90 ngày, tin liên hệ 12 tháng, bản backup DB tối đa 14 ngày (workflow xoá theo tuổi), thông báo không kèm dữ liệu khách, xử lý yêu cầu xoá trong 72h. Đổi hành vi thì sửa cả trang này.
- `DataRetentionWorker` xoá chat > 90 ngày, tin liên hệ > 12 tháng.
- Form liên hệ bắt buộc tick đồng ý (`consent`), backend từ chối nếu thiếu và lưu `ConsentedAt`.
- Email và Telegram chỉ báo "có tin mới", **không** chép tên, email, nội dung khách (máy chủ Gmail/Telegram ở nước ngoài → sẽ phải lập hồ sơ chuyển dữ liệu xuyên biên giới). Không log email khách.
- Chatbot ghi rõ là AI, có thể sai, lưu 90 ngày. Yêu cầu xoá: admin xoá được tin liên hệ (Inbox) và phiên chat (AI logs).

## AI trên server
- **Sigma Cat là nhân vật riêng có tính cách sigma, trợ lý của anh Khôi, không phải anh Khôi.** Giữ giọng này ở mọi câu.
- Chạy `qwen3:4b-instruct` trên CPU + MX150 (2 GB, 22 layer). Chọn sau khi so với `qwen3.5:4b` và `gemma3:4b` (2026-11-08): nhanh nhất và đúng nhất. Không dùng model lai như Qwen3.5: cache prompt chỉ giữ được một phần nên chờ chữ đầu ~4s. GPU bật qua `docker-compose.gpu.yml`, workflow ghi `COMPOSE_FILE` vào `.env`; máy không có NVIDIA chỉ dùng `docker-compose.yml`.
- Không có Modelfile: backend gửi prompt dựng từ DB mỗi tin. Thông tin nằm ở DB (admin), giọng nói ở `src/Portfolio.AI`.
- Đổi prompt / model: chạy `python3 scripts/eval-sigma.py` trên server trước và sau để so điểm.
- Mốc 2026-11-08: 45/47, chờ chữ đầu ~1,4s, trọn câu ~6,8s, ~21 từ mỗi câu (`qwen3.5:4b` cũ: 43/47, 4,3s, 8,1s).
- Mọi câu trả lời do model sinh ra, không có câu soạn sẵn (Khôi chốt). Chỉ thông báo hệ thống (quota, bận, lỗi) là cố định.
- Backend xác định ngôn ngữ trả lời (`ChatLanguage.ForReply`) và ra lệnh ở cuối tin; để model tự chọn thì nó nghiêng về tiếng Việt.

## Song ngữ và nội dung
- `/` tiếng Anh (mặc định), `/vi` tiếng Việt, `/en` chuyển 301 về `/`. Chữ cố định ở `src/Web/frontend/src/lib/i18n.ts`; dữ liệu DB có cột `...En` (profile: `TitleEn`, `BioEn`; experience: `RoleEn`, `CompanyEn`, `PeriodEn`, `ProjectNameEn`, `HighlightsEn`), API trả cả hai, frontend chọn bằng `pick()`. Sửa được trong admin.
- **Đổi dữ liệu bằng script:** thêm file mới đánh số trong `database/updates/` (`0002-ten.sql`), push. CI chạy `scripts/apply-db-updates.sh` sau khi backend healthy: mỗi file chạy đúng 1 lần trong 1 transaction, ghi vào bảng `applied_scripts`, rồi restart backend để xoá cache. Không sửa file đã chạy (bị chặn), không để secret trong đó (repo public).
- **Một nguồn nội dung = DB, sửa trong admin** (`/dashboard`): hồ sơ, kinh nghiệm, kỹ năng, dự án, Now, fact Sigma Cat. Trang public không gọi API nội dung lúc chạy: lúc build, `scripts/export-content.py` lấy từ API ghi ra `src/Web/frontend/src/content/{portfolio,projects}.json` rồi prerender. `scripts/publish-content.sh` chạy cuối mỗi deploy và mỗi 30 phút (`.github/workflows/publish.yml`): API khác `/content-snapshot.json` của bản đang chạy → build lại riêng container frontend. JSON trong repo chỉ là dự phòng cho máy dev / lần deploy đầu (export lỗi thì dùng nó).
- Viết mộc mạc, không buzzword; Masan chỉ nêu ngắn trong mục kinh nghiệm, không đưa lên bio hay SEO.
- Mục **Projects** + trang `/projects/<slug>` chỉ cho sản phẩm riêng của Khôi (ChickenNote, dangvykhoi.com). Kể ý tưởng, không khoe công nghệ; ChickenNote ghi thẳng là vibe code. Chữ sửa trong admin; thêm dự án / đổi slug / đổi ảnh thì qua repo (nginx location + `public/projects/` + dòng DB).

## Chạy & kiểm tra
```bash
docker compose up -d --build
dotnet build src/Portfolio.API
cd src/Web/frontend && npm run build && npm run lint
```

## Deploy
Push `main` = deploy production ngay (self-hosted runner: `scripts/server-secrets.sh ensure` → tạo `.env` → **backup DB** `pg_dump` vào `~/backups/portfolio/` (giữ 14 bản, lỗi thì dừng deploy) → `compose build` → `up -d postgres` + `server-secrets.sh sync-db` → `up -d --remove-orphans` → tải model AI → health check `localhost:18122`). Chỉ push khi Khôi nói "làm đi". Smoke test 2 domain: `bash ../Zwork/smoke.sh`.

**Secret:** mật khẩu Postgres và JWT secret **không nằm trên GitHub** — được sinh và lưu trên server tại `~/.config/portfolio/{postgres_password,jwt_secret}` (chmod 600). Muốn xoay: xoá file tương ứng trên server rồi deploy lại (xoay JWT = admin đăng nhập lại). GitHub Secrets chỉ còn `MAIL_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (và `ADMIN_PASSWORD` nếu muốn ép mật khẩu admin).

## Quy ước
- Repo **public**: không commit secret, `.env`, IP nhà, hay ghi chú về lỗ hổng chưa vá.
- Trả lời tiếng Việt; text hiển thị cho người dùng là tiếng Việt.
- File nháp để ở `../Zwork/`.
