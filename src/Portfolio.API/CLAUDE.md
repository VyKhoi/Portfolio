# src/Portfolio.API — backend .NET 9


## Program.cs (thứ tự)
1. Serilog → console + `logs/portfolio-.txt` (xoay vòng theo ngày, giữ 7 file).
2. `AddDbContext` Npgsql từ `ConnectionStrings:DefaultConnection` — thiếu thì throw (không có fallback).
3. `AddMemoryCache` (dùng cho cache content + mọi quota/lockout).
4. JWT Bearer HS256 từ `JwtService.GetValidatedSecret` (thiếu → throw; < 32 ký tự → log cảnh báo). `OnTokenValidated`: token có claim `pwd_ver` phải khớp `PasswordStamp(user.PasswordHash)` (cache 1 phút) — token cũ không có claim vẫn hợp lệ tới hết hạn.
5. Singleton `ContactChannel`, `JwtService`, `AiConcurrencyGate`; hosted `EmailBackgroundWorker`, `ChatRetentionWorker`; typed HttpClient `TelegramNotifier`, `OllamaClient`.
6. CORS chỉ `Cors:AllowedOrigins` (prod: dangvykhoi.com + www; dev: localhost:5173, :18122).
7. `ForwardedHeaders` tin `X-Forwarded-For` từ dải private (10/8, 172.16/12, 192.168/16, loopback) → `RemoteIpAddress` = IP thật của khách.
8. OpenAPI chỉ map ở Development.
9. `SeedData.InitializeAsync` (migrate + seed) trước `app.Run()`; lỗi chỉ log, không dừng app.

## Cấu hình
`appsettings.json` = giá trị không bí mật (repo public). `appsettings.Development.json` = connection string + JWT secret giả cho dev (`dotnet run` dùng Development qua `Properties/launchSettings.json`). Production override bằng env trong `docker-compose.yml`: `ConnectionStrings__DefaultConnection`, `JwtSettings__Secret`, `ADMIN_PASSWORD`, `MAIL_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `Ollama__BaseUrl`, `Ollama__Model`.

## Package
BCrypt.Net-Next, MailKit, JwtBearer 9, OpenApi 9, EF Core 9 + Npgsql 9, Serilog.AspNetCore, `System.Security.Cryptography.Pkcs` 9.0.22 (pin để vá lỗ hổng bản 8.0.1 kéo theo từ MimeKit). Kiểm tra: `dotnet list package --vulnerable --include-transitive`.

## Dockerfile
Build từ **root repo** (`context: .`), restore csproj → publish Release → `aspnet:9.0`, cổng 8080, chạy bằng user non-root `$APP_UID` (thư mục `/app/logs` được chown).

## Controllers

🔒 = `[Authorize]` (JWT). Tất cả trả JSON, lỗi dạng `{ error: "..." }`.

### AuthController — `api/auth` (alias cũ `identity/api/auth`)
- `POST login` `{username, password}` → `{token, username, role}`; so username không phân biệt hoa thường, BCrypt verify (luôn verify kể cả user không tồn tại → không đo được thời gian). Sai 5 lần/IP → 429 trong 15 phút.
- 🔒 `POST change-password` `{currentPassword, newPassword}` (8–200 ký tự) → trả `{message, token}` mới; mọi token cũ bị thu hồi (frontend `ProfileSettings` lưu token mới).
- Không có đăng ký — chỉ có user `admin` do seed tạo.

### ContentController — `api/content`
- `profile` GET / 🔒PUT (1 bản ghi duy nhất, PUT tạo mới nếu chưa có).
- `skills`, `experience` (alias `experiences`), `projects`: GET list (sắp theo `Order`), 🔒POST, 🔒PUT `{id}`, 🔒DELETE `{id}`.
- PUT copy **từng field** sang entity đang track — thêm field mới vào entity thì nhớ thêm dòng copy ở đây.
- Cache `IMemoryCache` key `content:profile|skills|experiences|projects` 30 phút; mọi thao tác ghi đều `Remove` key.
- POST project tự sinh `Slug` = title-lowercase + 4 ký tự GUID nếu trống.

### ContactController — `api/contact`
- `POST messages` `{name, email, message, companyTrap}` — `companyTrap` có giá trị = bot → trả OK giả, không lưu. Giới hạn 100/100/1000 ký tự, email phải hợp lệ (`MailAddress`), 3 tin/giờ/IP → 429. Lưu DB rồi `ContactChannel.PublishAsync` để gửi mail nền.
- 🔒 `GET messages`, 🔒 `PATCH messages/{id}/status` `{status}` (chỉ `Pending|Read|Replied`), 🔒 `DELETE messages/{id}`.

### AIController — `api/ai` (~650 dòng)
- `POST chat` (không stream) và `POST chat/stream` (SSE, frame `data: {"token","chunk"}`, kết thúc `data: [DONE]`). Hai hàm gần như trùng logic — sửa một thì sửa cả hai.
- Các bước: honeypot `websiteTrap` → rỗng / > 350 ký tự → `NormalizeSessionId` (sai định dạng → GUID mới) → quota 15 tin / 10 phút theo IP → upsert `ChatSession` + lưu message → Telegram (fire-and-forget `Task.Run`) → `TryGetFastIntentReply` (so khớp chuỗi có/không dấu, trả câu soạn sẵn) → nếu không khớp thì qua `AiConcurrencyGate` (tối đa 2 cùng lúc, chờ 15s, không được thì trả `BusyReply`) → `OllamaClient` (6 message gần nhất) → lưu reply → Telegram.
- `GET history/{sessionId}` (public, cho widget khôi phục hội thoại), 🔒 `GET sessions`, 🔒 `GET sessions/{id}/messages`.
- Thông tin cá nhân nằm cứng trong Fast Intent — đổi CV thì sửa cả `src/Portfolio.AI/knowledge` lẫn hàm này.

## Services

| File | Lifetime | Việc |
| :--- | :--- | :--- |
| `JwtService.cs` | Singleton | `GenerateToken(user)`: HS256, claim `NameIdentifier/Name/Role/pwd_ver`, hạn **3 ngày**; `GetValidatedSecret`, `PasswordStamp` |
| `AiConcurrencyGate.cs` | Singleton | `SemaphoreSlim(2)` chặn số request Ollama đồng thời |
| `ChatRetentionWorker.cs` | HostedService | Mỗi 24h xoá `ChatMessages`/`ChatSessions` cũ hơn 90 ngày |
| `ContactChannel.cs` | Singleton | `Channel<ContactMessage>` bounded 100, `DropOldest` (nhiều writer, 1 reader) |
| `EmailBackgroundWorker.cs` | HostedService | Vòng lặp đọc channel → `EmailService`; lỗi thì log + chờ 1s. Hàng đợi chỉ trong RAM (restart là mất, nhưng message đã nằm trong DB) |
| `EmailService.cs` | Transient | Dựng email HTML (dark theme) → MailKit Gmail `smtp.gmail.com:587` StartTLS. Mật khẩu từ `Mail:Password` hoặc `MAIL_APP_PASSWORD`; thiếu → chỉ log warning. Trường khách nhập được `HtmlEncode`; tối đa 30 email/ngày |
| `OllamaClient.cs` | Typed HttpClient | `GenerateReplyAsync` (không stream) và `StreamReplyAsync` (đọc NDJSON từng dòng của `/api/chat`). Timeout 60s. Lỗi → trả câu "Meow..." thay vì throw |
| `TelegramNotifier.cs` | Typed HttpClient | `SendMessageAsync(html)` → Bot API `sendMessage`, `parse_mode: HTML`, tối đa 30 tin/giờ (tin thứ 30 kèm thông báo tạm ngưng). Nội dung động phải qua `TelegramNotifier.Escape`. Thiếu token/chatId → bỏ qua |

## Data (+ Entities, Migrations)

### Entities (`../Entities/Entities.cs` — tất cả trong 1 file)
| Entity | Khoá | Field đáng chú ý |
| :--- | :--- | :--- |
| `User` | Guid | `Username` (unique), `PasswordHash` (BCrypt), `Role`="Admin" |
| `Profile` | Guid | `FullName, Title, Bio, AvatarKey, CvPdfKey, GithubLink, LinkedinLink` (1 dòng) |
| `Skill` | Guid | `Name, Category, IconSvgKey, ProficiencyLevel, Order` |
| `Experience` | Guid | `Role, Company, Period, ProjectName, Highlights text[], TechStack text[], Order` |
| `Project` | Guid | `Slug` (unique), `Summary, DescriptionMdx, CoverImageKey, TechStack` (chuỗi JSON), `DemoUrl, GithubUrl, Order, IsFeatured, Status, ViewCount` |
| `ContactMessage` | Guid | `Name, Email, Subject, Message, Status` (Pending/Read/Replied) |
| `ChatSession` | int | `SessionId` (string, unique), `StartedAt, LastMessageAt` |
| `ChatMessage` | int | `SessionId` (index), `Role` user/assistant, `Content` |

### PortfolioDbContext.cs
DbSet cho từng entity + khai báo key/index ở `OnModelCreating`. Không có quan hệ FK (ChatMessage nối ChatSession qua chuỗi `SessionId`).

### SeedData.cs (chạy mỗi lần khởi động)
1. `Database.MigrateAsync()`.
2. User `admin`: chưa có → tạo với `ADMIN_PASSWORD` (hoặc mật khẩu ngẫu nhiên nếu không set). Đã có mà `ADMIN_PASSWORD` khác hash → **ghi đè** mật khẩu theo env (đổi mật khẩu trong UI sẽ bị reset ở lần deploy sau nếu env vẫn set).
3. Profile: tạo nếu chưa có; nâng cấp tên không dấu cũ → có dấu.
4. Experiences / Skills: chỉ seed khi bảng trống.

### Migrations
Hiện có `20261024145452_InitialCreate`. Thêm thay đổi:
```bash
dotnet ef migrations add <TenMigration> --project src/Portfolio.API
```
Commit cả file migration + `PortfolioDbContextModelSnapshot.cs`. Không cần chạy `database update` trên server — app tự migrate.

