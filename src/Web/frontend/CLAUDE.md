# src/Web/frontend — React SPA + nginx container

Chi tiết: `docs/FRONTEND.md`.

## Stack
React 19, TypeScript ~6, Vite 8 (rolldown, `manualChunks` tách vendor-motion / vendor-query / vendor-react), Tailwind 4, Framer Motion, lucide-react, Zustand, TanStack Query (chỉ admin), React Router 7, oxlint. Alias `@` → `src/`.
Chatbot escape HTML trước khi đổi `**đậm**`/`*nghiêng*` (`escapeHtml` trong `CatChatbot.tsx`).

## src/
| Đường dẫn | Việc |
| :--- | :--- |
| `main.tsx` | Prefetch content public trước khi React mount; bắt `vite:preloadError` để reload 1 lần sau deploy |
| `App.tsx` | Route `/` (Home), `/login` (form login nằm luôn trong file này), `/dashboard/*` (lazy `AdminLayout`, `ProtectedRoute` kiểm token). `CatChatbot` lazy, hiện sau 1.2s, ẩn ở login/dashboard |
| `pages/public/Home.tsx` | Navbar → Hero → About → ProjectsBento → Contact → Footer |
| `components/public/`, `components/admin/` | Xem hai mục cuối file này |
| `components/ui/` | Badge, Button, Card, Input kiểu shadcn |
| `components/CatChatbot.tsx` | Widget chat: `sessionId` ở `localStorage['ai_chat_session_id']`, tải `/api/ai/history/{id}`, POST `/api/ai/chat/stream` rồi đọc `ReadableStream` tách dòng `data: ` |
| `lib/api.ts` | `API_BASE_URL='/api'`, `ContentApi` (profile/experience/skills), `ContactApi` |
| `lib/contentCache.ts` | Cache `localStorage` `content-cache:v2:*` + `useCachedContent(key, fallback, isValid)` |
| `store/authStore.ts` | JWT ở `localStorage['token']` |
| `store/adminThemeStore.ts` | Theme admin dark/light |
| `index.css` | Tailwind + class `adm-*` cho 2 theme admin |

`index.html` chứa SEO (meta, OpenGraph, JSON-LD Person/WebSite/ProfilePage/FAQPage), boot splash và HTML fallback cho crawler — sửa thông tin cá nhân thì sửa cả ở đây.

## Container
`Dockerfile`: `node:20-alpine` build → `nginx:alpine` serve `dist/`. `nginx.conf` của container: route `/api/*` → `backend:8080`, realip từ `X-Real-IP` của gateway (rate limit tính theo IP thật của khách), rate limit POST (ai 20/phút, contact 5/phút, login 10/phút), CSP an toàn (`frame-ancestors`, `object-src`, `base-uri`, `form-action` — không giới hạn script vì `index.html` có `onload` inline để tải font), tắt buffer cho SSE, cache `/assets/` 1 năm, `noindex` cho `/login` `/dashboard`.

## Lệnh
`npm run dev` (proxy `/api` → `localhost:5000`) · `npm run build` · `npm run lint`.

## components/public — các section trang chủ

| File | Hiển thị | Dữ liệu |
| :--- | :--- | :--- |
| `Navbar.tsx` | Thanh điều hướng, cuộn tới section | tĩnh |
| `HeroSection.tsx` | Tên, chức danh, avatar (`fetchPriority="high"` cho LCP) | `useCachedContent('profile')` |
| `AboutSection.tsx` | Giới thiệu + nhóm kỹ năng | `useCachedContent('skills')` + danh sách fallback hardcode |
| `ProjectsBento.tsx` | Lưới bento các dự án | `useCachedContent('experiences')` + fallback hardcode (bảng `Projects` trong DB hiện **không** được trang public dùng) |
| `ContactSection.tsx` | Form liên hệ có honeypot `companyTrap` | `ContactApi.submitMessage` |
| `Footer.tsx` | Footer | tĩnh |

Quy ước: luôn có fallback để trang không bao giờ trống khi API lỗi; style tối (`#0A0A0C`), màu nhấn `#DEFF9A`.

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
| `AIChatLogs.tsx` | Xem các phiên chat Sigma Cat | `ai/sessions`, `ai/sessions/{id}/messages` |
| `AdminLoader.tsx` | Skeleton loader + `RefreshingBadge` | — |

Query key: `profile`, `experiences`, `skills`, `projects`, `inbox`, `ai-sessions`. Sau mutation gọi `queryClient.invalidateQueries({ queryKey: [...] })`.
Style: class `adm-*` trong `src/index.css`, hai theme qua `data-theme` (Cyber Dark / Swiss Light).
