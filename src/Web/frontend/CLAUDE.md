# src/Web/frontend — React SPA + nginx container

Chi tiết: `docs/FRONTEND.md`.

## Stack
React 19, TypeScript ~6, Vite 8 (rolldown, `manualChunks` tách vendor-motion / vendor-query / vendor-react), Tailwind 4, Framer Motion, lucide-react, Zustand, TanStack Query (chỉ admin), React Router 7, oxlint. Alias `@` → `src/`.
Chatbot escape HTML trước khi đổi `**đậm**`/`*nghiêng*` (`escapeHtml` trong `CatChatbot.tsx`). Dưới ô chat luôn có dòng báo là AI + lưu 90 ngày + link chính sách.

## src/
| Đường dẫn | Việc |
| :--- | :--- |
| `main.tsx` | Trang đã prerender (`data-prerendered`) thì `hydrateRoot`, còn lại (app shell) `createRoot`; bắt `vite:preloadError`; tải `oneko.js` lúc rảnh, chỉ khi có chuột |
| `App.tsx` | `AppRoutes`: `/`, `/vi` (Home), `/privacy`, `/vi/privacy` (Privacy), `/projects/:slug`, `/vi/projects/:slug` (ProjectPage), `/login`, `/dashboard/*` (lazy `AdminEntry`), `ScrollManager` (đổi trang → lên đầu, link có `#mục` → cuộn tới mục), bọc `LazyMotion` + `MotionConfig reducedMotion="user"`. Dùng chung cho `main.tsx` và `entry-server.tsx`. Chỉ dùng `m.*`, không dùng `motion.*` (`strict`) |
| `entry-server.tsx` + `scripts/prerender.mjs` | Lúc build render `/` (en), `/vi`, `/privacy`, `/vi/privacy`, `/projects/<slug>` + `/vi/projects/<slug>` thành HTML thật (head, JSON-LD, CSS inline), sinh `app.html` (login/admin, noindex), `404.html`, `sitemap.xml` (lastmod = ngày build) và `content-snapshot.json` (nội dung bản build này, admin + `scripts/publish-content.sh` so với API). Code chạy lúc render **không được** đụng `window`/`localStorage` ngoài effect |
| `content/privacy.ts` | Chính sách quyền riêng tư vi + en, `PRIVACY_PATH`. Phải khớp hành vi backend (thời hạn giữ, thông báo) |
| `content/projects.ts` + `content/projects.json` | Kiểu dữ liệu + helper cho 2 dự án riêng của Khôi. Chữ nằm trong **DB** (admin → Dự án); `projects.json` được ghi từ API lúc build. Ảnh ở `public/projects/` (webp 1200px trang, 800px thẻ, jpg 1200×630 og; link kèm `?v=N`, nginx cache 30 ngày → đổi ảnh thì tăng N). Thêm slug: nginx location + ảnh + dòng trong DB |
| `content/portfolio.json` | profile, experiences, skills, now: **ghi từ API lúc build** (`scripts/export-content.py`), trang public import thẳng, không gọi API lúc chạy. Bản trong repo chỉ là dự phòng cho máy dev |
| `content/seo.json` | Title/description từng ngôn ngữ |
| `lib/i18n.ts` | `useLang()` theo URL, `useT()` chữ cố định (tiêu đề mục, nút…), `pick(item, key, lang)` chọn cột `...En`, `otherLangPath` cho nút EN/VI |
| `pages/public/Home.tsx` | Navbar → Hero → About → ProjectsSection → ProjectsBento (Experience) → NowSection → Contact → Footer |
| `pages/public/NotFound.tsx` | Trang 404 cùng giao diện site. Prerender thành `dist/404.html` **không kèm bundle JS** (nếu có, router sẽ đưa URL lạ về trang chủ): chỉ dùng `<a>` thường, không hook |
| `pages/public/ProjectPage.tsx` | Trang chi tiết project: tiêu đề, Năm / Trạng thái / Phần tôi làm, ảnh, 4 mục (vấn đề, ý tưởng, cách làm, điều rút ra), dự án tiếp theo + liên hệ |
| `components/public/`, `components/admin/` | Xem hai mục cuối file này |
| `components/ui/` | Badge, Button, Card, Input kiểu shadcn |
| `components/CatChatbot.tsx` | Widget chat: `sessionId` ở `localStorage['ai_chat_session_id']`, tải `/api/ai/history/{id}`, POST `/api/ai/chat/stream` kèm `lang`, đọc SSE `{token}` / `{notice}`. Mọi chữ lấy từ `t.chat`. Mở chat (callback ref `attachList`) và bấm vào ô nhập → cuộn khung tin nhắn (không phải cả trang) xuống tin mới nhất |
| `lib/api.ts` | `ContactApi` (form liên hệ) |
| `store/authStore.ts` | JWT ở `localStorage['token']` |
| `index.css` | Tailwind + token màu/font của site (admin dùng chung token, không có theme riêng) |

`index.html` chứa SEO (meta, OpenGraph, JSON-LD Person/WebSite/ProfilePage/FAQPage), boot splash và HTML fallback cho crawler — sửa thông tin cá nhân thì sửa cả ở đây.

## Container
`Dockerfile`: `node:20-alpine` build → `nginx:alpine` serve `dist/`. `nginx.conf`: route `/api/*` → `backend:8080`, rate limit POST (ai 20/phút, contact 5/phút, login 10/phút), tắt buffer cho SSE, cache `/assets/` 1 năm, HTML `s-maxage=120` (có tác dụng khi bật Cache Rule ở Cloudflare), đường dẫn lạ trả 404 thật. CSP + `Permissions-Policy` + COOP ở `nginx-site-headers.conf` (`script-src 'self'`: cấm script inline, `onload=`, font/ảnh từ domain ngoài); X-Frame, nosniff, referrer, HSTS do gateway đặt.

## Lệnh
`npm run dev` (proxy `/api` → `localhost:5000`) · `npm run build` · `npm run lint`.

## components/public — các section trang chủ

| File | Hiển thị | Dữ liệu |
| :--- | :--- | :--- |
| `Navbar.tsx` | Thanh điều hướng; ở trang chủ là `#mục`, ở trang con là link về `/#mục` | tĩnh |
| `HeroSection.tsx` | Tên, chức danh, avatar (`fetchPriority="high"` cho LCP) | `portfolio.json` → `profile` |
| `AboutSection.tsx` | Giới thiệu + nhóm kỹ năng | `portfolio.json` → `skills` |
| `ProjectsSection.tsx` | Mục Projects: 2 thẻ sản phẩm riêng, bấm vào mở trang chi tiết | `content/projects.ts` |
| `NowSection.tsx` | Mục Now: các dòng đang làm gì + ngày cập nhật | `portfolio.json` → `now` |
| `ProjectsBento.tsx` | Mục Experience (timeline); dòng ChickenNote dẫn về trang chi tiết | `portfolio.json` → `experiences` |
| `ContactSection.tsx` | Form liên hệ có honeypot `companyTrap` + ô đồng ý bắt buộc (link `/privacy`) | `ContactApi.submitMessage` |
| `Footer.tsx` | Footer + link chính sách | tĩnh |

Quy ước: trang public không gọi API nội dung lúc chạy (chỉ form liên hệ + Sigma Cat); chỉ dùng token theme (`obsidian`, `surface`, `border`, `primary` cam `#FF5C00`, `text-main`, `text-muted`), góc vuông, font Space Grotesk / JetBrains Mono / Urbanist.

## components/admin: trang quản trị `/dashboard`

Một bundle lazy (`AdminEntry` → `AdminLayout`), tiếng Việt, cùng token màu / font / góc vuông với site, chỉ giao diện tối. Mỗi mục có URL riêng.

| File | Việc |
| :--- | :--- |
| `AdminLayout.tsx` | QueryClient, Toast + Confirm provider, thanh trái (desktop) / menu kéo ra (mobile), số tin chưa đọc, trạng thái xuất bản, route con |
| `api.ts` | `api()` / `send()` gắn token, 401 → đăng xuất, lỗi lấy `{error}` tiếng Việt từ backend; kiểu dữ liệu; `SKILL_GROUPS` (5 nhóm khớp `skillCategories` trong i18n); định dạng giờ |
| `ui.tsx` | Panel, Button, Field / TextInput / TextArea (tự giãn), `Bilingual` (vi trái, en phải), LinesEditor, TagsEditor, SortableList (@dnd-kit: chuột, cảm ứng, bàn phím), Tabs, Toast, ConfirmDialog, SaveBar, cảnh báo chưa lưu, Ctrl+S |
| `form.ts` | `useEditForm`: bản nháp của form, dirty, lưu, sau khi lưu làm mới query nội dung + trạng thái xuất bản. Nguồn truyền vào phải ổn định (`useMemo`), không thì form reset liên tục |
| `publish.ts` | `usePublishState`: so `/content-snapshot.json` với API → "Đã xuất bản" / "Chờ xuất bản" |
| `pages/Overview.tsx` | Số thật từ `GET admin/status`: tin chưa đọc, khách hỏi Sigma Cat 7 ngày, thời gian trả lời, lượt bị chặn quota, biểu đồ 7 ngày, Ollama (% trên GPU), commit đang chạy |
| `pages/Inbox.tsx` | Danh sách + nội dung, mở là đánh dấu đã đọc, trả lời qua `mailto:`, xoá (hỏi lại) |
| `pages/Profile.tsx`, `Experience.tsx`, `Skills.tsx`, `Projects.tsx`, `Now.tsx` | Sửa nội dung trang: song ngữ cạnh nhau, xem trước như trên site, kéo thả thứ tự |
| `pages/SigmaCat.tsx` | Tab Thông tin (fact), Hội thoại (xem / xoá, ẩn phiên thử), Số liệu, Hỏi thử (`X-Admin-Test: 1` + token: không quota, không Telegram, không vào số liệu) |
| `pages/Account.tsx` | Đổi mật khẩu (lưu token mới), đăng xuất |

Sửa nội dung → DB ngay → trang tĩnh cập nhật trong khoảng 30 phút (workflow `publish.yml`). Ảnh, CV, slug dự án mới vẫn qua repo.

