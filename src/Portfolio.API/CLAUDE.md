# src/Portfolio.API — backend .NET 9


## Program.cs (thứ tự)
1. Serilog → console + `logs/portfolio-.txt` (xoay vòng theo ngày, giữ 7 file).
2. `AddDbContext` Npgsql từ `ConnectionStrings:DefaultConnection` — thiếu thì throw (không có fallback).
3. `AddMemoryCache` (dùng cho cache content + mọi quota/lockout).
4. JWT Bearer HS256 từ `JwtService.GetValidatedSecret` (thiếu → throw; < 32 ký tự → log cảnh báo). `OnTokenValidated`: token có claim `pwd_ver` phải khớp `PasswordStamp(user.PasswordHash)` (cache 1 phút) — token cũ không có claim vẫn hợp lệ tới hết hạn.
5. Singleton `ContactChannel`, `JwtService`; hosted `EmailBackgroundWorker`; typed HttpClient `TelegramNotifier`. Sigma Cat đăng ký ở mục 6b (xem `Features/Chat`).
6. CORS chỉ `Cors:AllowedOrigins` (prod: dangvykhoi.com + www; dev: localhost:5173, :18122).
7. `ForwardedHeaders` tin `X-Forwarded-For` từ dải private (10/8, 172.16/12, 192.168/16, loopback) → `RemoteIpAddress` = IP thật của khách.
8. OpenAPI chỉ map ở Development.
9. `SeedData.InitializeAsync` (migrate + seed) trước `app.Run()`; lỗi chỉ log, không dừng app.

## Cấu hình
`appsettings.json` = giá trị không bí mật (repo public). `appsettings.Development.json` = connection string + JWT secret giả cho dev (`dotnet run` dùng Development qua `Properties/launchSettings.json`). Production override bằng env trong `docker-compose.yml`: `ConnectionStrings__DefaultConnection`, `JwtSettings__Secret`, `ADMIN_PASSWORD`, `MAIL_APP_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `Ollama__BaseUrl`, `Ollama__Model`. Tham số chat ở section `Chat` và `Ollama` (`Features/Chat/ChatOptions.cs`).

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
Nguồn nội dung duy nhất của site (frontend build từ các GET này qua `scripts/export-content.py`). Ghi nhận **request DTO** trong `ContentRequests.cs` (không nhận entity), kiểm tra bằng `ContentRules` và trả `{error}` **tiếng Việt** (admin hiện nguyên văn): độ dài, link chỉ `https://`, nhóm kỹ năng thuộc 5 nhóm cố định, ảnh dự án chỉ `/projects/<file>.webp|jpg`.
- `profile` GET / 🔒PUT (ảnh + CV không sửa qua API: file trong repo).
- `skills`: GET, 🔒POST (thêm cuối), 🔒PUT `{id}` (tên, nhóm), 🔒DELETE, 🔒PUT `skills/order` `{ids}` (phải đúng đủ các id).
- `experiences` (GET thêm alias `experience`): GET, 🔒POST (lên đầu dòng thời gian), 🔒PUT `{id}`, 🔒DELETE, 🔒PUT `experiences/order`.
- `projects`: GET trả đúng hình `content/projects.json` (`[{slug, year, url, image, thumb, ogImage, schemaType, copy: {en, vi}}]`); 🔒PUT `projects/{slug}` sửa chữ / link. Không tạo / xoá / đổi slug qua API (cần nginx + ảnh).
- `now`: GET `{updated (ngày VN), items: [{label, labelEn, text, textEn}]}`, 🔒PUT `{items}` thay cả danh sách (1–6 dòng), ngày cập nhật = lúc lưu.
- Cache `IMemoryCache` key `content:*` 30 phút; mọi thao tác ghi đều `Remove` key.

### AdminController — `api/admin` 🔒
`GET status`: tin chưa đọc, phiên chat 7 ngày (không tính phiên thử), trung vị thời gian trả lời, số lượt bị chặn quota (`ChatQuota.RefusedSince`, trong RAM), 7 ngày theo giờ VN, Ollama `/api/ps` (model nạp chưa, % trên GPU), `BUILD_COMMIT`/`BUILD_TIME` (env do workflow ghi).

### ContactController — `api/contact`
- `POST messages` `{name, email, message, consent, companyTrap}` — thiếu `consent=true` → 400, lưu `ConsentedAt`. `companyTrap` có giá trị = bot → trả OK giả, không lưu. Giới hạn 100/100/1000 ký tự, email phải hợp lệ (`MailAddress`), 3 tin/giờ/IP → 429. Lưu DB rồi `ContactChannel.PublishAsync` để gửi mail nền.
- 🔒 `GET messages`, 🔒 `PATCH messages/{id}/status` `{status}` (chỉ `Pending|Read|Replied`), 🔒 `DELETE messages/{id}`.

### AIController — `api/ai`
Mỏng, không chứa logic chat. `POST chat/stream` (SSE: `{token}` là câu trả lời, `{notice}` là thông báo hệ thống, kết thúc `[DONE]`), `GET history/{sessionId}` (public), 🔒 `sessions`, `sessions/{id}/messages`, `DELETE sessions/{id}` (yêu cầu xoá), `stats` (bỏ phiên thử), CRUD `facts`. Gửi kèm token admin + header `X-Admin-Test: 1` → `ChatTurn.IsTest`: không quota, không Telegram, phiên đánh dấu `IsTest` (tab "Hỏi thử" trong admin).

## Features/Chat (Sigma Cat)
| File | Việc |
| :--- | :--- |
| `ChatService.cs` | Một luồng duy nhất: từ chối (honeypot, rỗng, quá dài, quota) → lưu tin → model → lưu reply + thời gian → Telegram. Không có câu trả lời soạn sẵn |
| `ChatPromptBuilder.cs` | Persona + facts + tối đa `MaxHighlightsPerJob` chi tiết mỗi công việc từ DB, dựng mỗi tin nên admin sửa là có hiệu lực. Không đưa dữ liệu thay đổi theo tin nhắn vào đây (hỏng cache prompt) |
| `OllamaClient.cs` | `ILlmClient`. Lỗi là `LlmUnavailableException`, không bao giờ trả câu lỗi như câu chat |
| `ChatAssets.cs` | Đọc `src/Portfolio.AI` (được copy vào `ai/` khi build) |
| `ChatGuards.cs` | `GenerationGate`, `ChatQuota`, `ChatSessionId`, `ChatLanguage` |
| `ChatWorkers.cs` | Gửi Telegram qua channel (1 tin mỗi lượt, chỉ mã phiên, không nội dung), `LlmWarmupService` nạp model lúc khởi động |

Không viết câu trả lời, fact hay từ khoá trong C#. Thông báo hệ thống không lưu vào DB.

## Services

| File | Lifetime | Việc |
| :--- | :--- | :--- |
| `JwtService.cs` | Singleton | `GenerateToken(user)`: HS256, claim `NameIdentifier/Name/Role/pwd_ver`, hạn **3 ngày**; `GetValidatedSecret`, `PasswordStamp` |
| `ContactChannel.cs` | Singleton | `Channel<ContactMessage>` bounded 100, `DropOldest` (nhiều writer, 1 reader) |
| `EmailBackgroundWorker.cs` | HostedService | Vòng lặp đọc channel → `EmailService`; lỗi thì log + chờ 1s. Hàng đợi chỉ trong RAM (restart là mất, nhưng message đã nằm trong DB) |
| `DataRetentionWorker.cs` | HostedService | Mỗi ngày xoá chat > 90 ngày, tin liên hệ > 12 tháng (khớp trang `/privacy`) |
| `EmailService.cs` | Transient | Email chỉ báo "có tin liên hệ mới" + link inbox, không chứa dữ liệu khách → MailKit Gmail `smtp.gmail.com:587` StartTLS. Mật khẩu từ `Mail:Password` hoặc `MAIL_APP_PASSWORD`; thiếu → chỉ log warning. tối đa 30 email/ngày |
| `TelegramNotifier.cs` | Typed HttpClient | `SendMessageAsync(html)` → Bot API `sendMessage`, `parse_mode: HTML`, tối đa 30 tin/giờ (tin thứ 30 kèm thông báo tạm ngưng). Nội dung động phải qua `TelegramNotifier.Escape`. Thiếu token/chatId → bỏ qua |

## Data (+ Entities, Migrations)

### Entities (`../Entities/Entities.cs` — tất cả trong 1 file)
| Entity | Khoá | Field đáng chú ý |
| :--- | :--- | :--- |
| `User` | Guid | `Username` (unique), `PasswordHash` (BCrypt), `Role`="Admin" |
| `Profile` | Guid | `FullName, Title, Bio, AvatarKey, CvPdfKey, GithubLink, LinkedinLink` (1 dòng) |
| `Skill` | Guid | `Name, Category, IconSvgKey, ProficiencyLevel, Order` |
| `Experience` | Guid | `Role, Company, Period, ProjectName, Highlights text[], TechStack text[], Order` |
| `Project` | Guid | `Slug` (unique), `Order`, `Content` (jsonb: cả trang dự án, hình như `projects.json` trừ slug), `UpdatedAt` |
| `NowItem` | Guid | `Label, LabelEn, Text, TextEn, Order, UpdatedAt` (mục Now) |
| `ContactMessage` | Guid | `Name, Email, Subject, Message, Status` (Pending/Read/Replied), `ConsentedAt` |
| `ChatSession` | int | `SessionId` (string, unique), `StartedAt, LastMessageAt`, `IsTest` (hỏi thử từ admin) |
| `ChatMessage` | int | `SessionId` (index), `Role` user/assistant, `Content`, `Source` (model), `FirstTokenMs`, `TotalMs` |
| `AssistantFact` | Guid | `Key` (unique), `Label`, `ValueVi`, `ValueEn`, `Order`, `Enabled`: fact riêng của Sigma Cat, sửa ở admin |

### PortfolioDbContext.cs
DbSet cho từng entity + khai báo key/index ở `OnModelCreating`. Không có quan hệ FK (ChatMessage nối ChatSession qua chuỗi `SessionId`).

### SeedData.cs (chạy mỗi lần khởi động)
1. `Database.MigrateAsync()`.
2. User `admin`: chưa có → tạo với `ADMIN_PASSWORD` (hoặc mật khẩu ngẫu nhiên nếu không set). Đã có mà `ADMIN_PASSWORD` khác hash → **ghi đè** mật khẩu theo env (đổi mật khẩu trong UI sẽ bị reset ở lần deploy sau nếu env vẫn set).
3. Profile: tạo nếu chưa có; nâng cấp tên không dấu cũ → có dấu.
4. Experiences / Skills: chỉ seed khi bảng trống.
5. Projects / NowItems: bảng trống thì nạp từ `content/projects.json` + `portfolio.json` của frontend (nhúng vào DLL lúc build, `SeedContent.cs`).

### Migrations
Hiện có `InitialCreate`, `AddEnglishContent`, `AddSigmaCatFacts`, `AddContactConsent`, `AdminV2` (Projects thành jsonb, xoá 2 dòng mẫu cũ, thêm `NowItems`, `ChatSessions.IsTest`). Thay đổi **dữ liệu** thì dùng `database/updates/` (xem `CLAUDE.md` ở root). Thay đổi **schema**:
```bash
dotnet ef migrations add <TenMigration> --project src/Portfolio.API
```
Commit cả file migration + `PortfolioDbContextModelSnapshot.cs`. Không cần chạy `database update` trên server — app tự migrate.

