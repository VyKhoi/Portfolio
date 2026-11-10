# src/Web/frontend — React SPA + nginx container

Chi tiết: `docs/FRONTEND.md`.

## Stack
React 19, TypeScript ~6, Vite 8 (rolldown, `manualChunks` tách vendor-motion / vendor-query / vendor-react), Tailwind 4, Framer Motion, lucide-react, Zustand, TanStack Query (chỉ admin), React Router 7, oxlint. Alias `@` → `src/`.
Chatbot escape HTML trước khi đổi `**đậm**`/`*nghiêng*` (`escapeHtml` trong `CatChatbot.tsx`). Dưới ô chat luôn có dòng báo là AI + lưu 90 ngày + link chính sách.

## src/
| Đường dẫn | Việc |
| :--- | :--- |
| `main.tsx` | Trang đã prerender (`data-prerendered`) thì `hydrateRoot`, còn lại (app shell) `createRoot`; prefetch content; bắt `vite:preloadError`; tải `oneko.js` lúc rảnh, chỉ khi có chuột |
| `App.tsx` | `AppRoutes`: `/`, `/vi` (Home), `/privacy`, `/vi/privacy` (Privacy), `/projects/:slug`, `/vi/projects/:slug` (ProjectPage), `/login`, `/dashboard/*` (lazy `AdminEntry`), `ScrollManager` (đổi trang → lên đầu, link có `#mục` → cuộn tới mục), bọc `LazyMotion` + `MotionConfig reducedMotion="user"`. Dùng chung cho `main.tsx` và `entry-server.tsx`. Chỉ dùng `m.*`, không dùng `motion.*` (`strict`) |
| `entry-server.tsx` + `scripts/prerender.mjs` | Lúc build render `/` (en), `/vi`, `/privacy`, `/vi/privacy`, `/projects/<slug>` + `/vi/projects/<slug>` thành HTML thật (head, JSON-LD, CSS inline), sinh `app.html` (login/admin, noindex) và `404.html`. Code chạy lúc render **không được** đụng `window`/`localStorage` ngoài effect |
| `content/privacy.ts` | Chính sách quyền riêng tư vi + en, `PRIVACY_PATH`. Phải khớp hành vi backend (thời hạn giữ, thông báo) |
| `content/projects.ts` | Sản phẩm riêng của Khôi (ChickenNote, dangvykhoi.com): chữ vi + en cho thẻ ở trang chủ và trang chi tiết, ảnh ở `public/projects/` (webp cho trang, jpg 1200×630 cho og:image). Kể ý tưởng, không liệt kê công nghệ; việc ở công ty không có trang riêng. Thêm slug thì thêm cả vào `nginx.conf` (location projects) và `public/sitemap.xml` |
| `content/portfolio.json`, `content/seo.json` | Nội dung dự phòng (vi + en), title/description từng ngôn ngữ |
| `lib/i18n.ts` | `useLang()` theo URL, `useT()` chữ cố định (cả mục Now: sửa chữ + ngày cập nhật ở `now`), `pick(item, key, lang)` chọn cột `...En`, `otherLangPath` cho nút EN/VI |
| `pages/public/Home.tsx` | Navbar → Hero → About → ProjectsSection → ProjectsBento (Experience) → NowSection → Contact → Footer |
| `pages/public/ProjectPage.tsx` | Trang chi tiết project: tiêu đề, Năm / Trạng thái / Phần tôi làm, ảnh, 4 mục (vấn đề, ý tưởng, cách làm, điều rút ra), dự án tiếp theo + liên hệ |
| `components/public/`, `components/admin/` | Xem hai mục cuối file này |
| `components/ui/` | Badge, Button, Card, Input kiểu shadcn |
| `components/CatChatbot.tsx` | Widget chat: `sessionId` ở `localStorage['ai_chat_session_id']`, tải `/api/ai/history/{id}`, POST `/api/ai/chat/stream` kèm `lang`, đọc SSE `{token}` / `{notice}`. Mọi chữ lấy từ `t.chat` |
| `lib/api.ts` | `API_BASE_URL='/api'`, `ContentApi` (profile/experience/skills), `ContactApi` |
| `lib/contentCache.ts` | Cache `localStorage` `content-cache:v3:*` + `useCachedContent(key, fallback, isValid)` |
| `store/authStore.ts` | JWT ở `localStorage['token']` |
| `store/adminThemeStore.ts` | Theme admin dark/light |
| `index.css` | Tailwind + class `adm-*` cho 2 theme admin |

`index.html` chứa SEO (meta, OpenGraph, JSON-LD Person/WebSite/ProfilePage/FAQPage), boot splash và HTML fallback cho crawler — sửa thông tin cá nhân thì sửa cả ở đây.

## Container
`Dockerfile`: `node:20-alpine` build → `nginx:alpine` serve `dist/`. `nginx.conf`: route `/api/*` → `backend:8080`, rate limit POST (ai 20/phút, contact 5/phút, login 10/phút), tắt buffer cho SSE, cache `/assets/` 1 năm, HTML `s-maxage=120` (có tác dụng khi bật Cache Rule ở Cloudflare), đường dẫn lạ trả 404 thật. CSP + `Permissions-Policy` + COOP ở `nginx-site-headers.conf` (`script-src 'self'`: cấm script inline, `onload=`, font/ảnh từ domain ngoài); X-Frame, nosniff, referrer, HSTS do gateway đặt.

## Lệnh
`npm run dev` (proxy `/api` → `localhost:5000`) · `npm run build` · `npm run lint`.

## components/public — các section trang chủ

| File | Hiển thị | Dữ liệu |
| :--- | :--- | :--- |
| `Navbar.tsx` | Thanh điều hướng; ở trang chủ là `#mục`, ở trang con là link về `/#mục` | tĩnh |
| `HeroSection.tsx` | Tên, chức danh, avatar (`fetchPriority="high"` cho LCP) | `useCachedContent('profile')` |
| `AboutSection.tsx` | Giới thiệu + nhóm kỹ năng | `useCachedContent('skills')` + danh sách fallback hardcode |
| `ProjectsSection.tsx` | Mục Projects: 2 thẻ sản phẩm riêng, bấm vào mở trang chi tiết | `content/projects.ts` |
| `NowSection.tsx` | Mục Now: 4 dòng đang làm gì + ngày cập nhật | `t.now` trong `lib/i18n.ts` |
| `ProjectsBento.tsx` | Mục Experience (timeline); dòng ChickenNote dẫn về trang chi tiết | `useCachedContent('experiences')` + fallback hardcode (bảng `Projects` trong DB hiện **không** được trang public dùng) |
| `ContactSection.tsx` | Form liên hệ có honeypot `companyTrap` + ô đồng ý bắt buộc (link `/privacy`) | `ContactApi.submitMessage` |
| `Footer.tsx` | Footer + link chính sách | tĩnh |

Quy ước: luôn có fallback để trang không bao giờ trống khi API lỗi; chỉ dùng token theme (`obsidian`, `surface`, `border`, `primary` cam `#FF5C00`, `text-main`, `text-muted`), góc vuông, font Space Grotesk / JetBrains Mono / Urbanist.

## components/admin — admin console (`/dashboard`)

Toàn bộ thư mục là **một** bundle lazy (import từ `App.tsx`). Gọi API bằng `fetch('/api/...')` kèm header `Authorization: Bearer <token>` lấy từ `useAuthStore`.

| File | Việc | API |
| :--- | :--- | :--- |
| `AdminLayout.tsx` | `QueryClientProvider`, prefetch nền mọi query, khung layout + chọn tab | profile, experience, skills, projects, contact/messages, ai/sessions |
| `Sidebar.tsx` | Menu tab, đổi theme, logout | — |
| `DashboardOverview.tsx` | Thẻ thống kê tổng | experience, projects, skills, contact/messages, ai/sessions |
| `ProfileSettings.tsx` | Sửa profile + đổi mật khẩu | `PUT content/profile`, `POST auth/change-password` |
| `ExperienceCRUD.tsx` | CRUD kinh nghiệm | `content/experience[/{id}]` |
| `SkillCRUD.tsx` | CRUD kỹ năng | `content/skills[/{id}]` |
| `ProjectCRUD.tsx` | CRUD project | `content/projects[/{id}]` |
| `InboxTable.tsx` | Hộp thư liên hệ: đổi trạng thái, xoá | `contact/messages[/{id}[/status]]` |
| `SigmaCatFacts.tsx` | Sửa fact của Sigma Cat + số liệu 7 ngày (thời gian trả lời) | `ai/facts[/{id}]`, `ai/stats` |
| `AIChatLogs.tsx` | Xem các phiên chat kèm nguồn trả lời và thời gian, xoá 1 phiên | `ai/sessions`, `ai/sessions/{id}/messages`, `DELETE ai/sessions/{id}` |
| `AdminLoader.tsx` | Skeleton loader + `RefreshingBadge` | — |

Query key: `profile`, `experiences`, `skills`, `projects`, `inbox`, `ai-sessions`. Sau mutation gọi `queryClient.invalidateQueries({ queryKey: [...] })`.
Style: class `adm-*` trong `src/index.css`, hai theme qua `data-theme` (Cyber Dark / Swiss Light).
