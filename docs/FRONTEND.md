# Frontend (`src/Web/frontend`)

## 1. Tech stack (thực tế đang dùng)

- React 19 + TypeScript 6 + **Vite 8** (rolldown), lint bằng **oxlint**
- Tailwind CSS v4 (`@tailwindcss/vite`), Framer Motion, lucide-react
- Zustand (auth, theme admin), TanStack Query (chỉ trong admin), `fetch` thuần (`lib/api.ts`)
- React Router DOM v7
- `@microsoft/signalr`, `axios` có trong `package.json` nhưng hiện **không được import** ở đâu (có thể gỡ)

## 2. Cấu trúc

```
src/
├── main.tsx                 # prefetch content public + tự reload 1 lần khi chunk cũ bị xoá sau deploy
├── App.tsx                  # Router: "/" (Home), "/login", "/dashboard/*" (lazy, ProtectedRoute), chatbot lazy sau 1.2s
├── index.css                # Tailwind + theme admin (data-theme dark/light, class adm-*)
├── pages/public/Home.tsx    # Navbar → Hero → About → ProjectsBento → Contact → Footer
├── components/
│   ├── public/              # Hero (profile), About (skills), ProjectsBento (experiences), Contact (form + honeypot)
│   ├── admin/               # AdminLayout (QueryClient + prefetch), Sidebar, DashboardOverview, ProfileSettings,
│   │                        # ExperienceCRUD, SkillCRUD, ProjectCRUD, InboxTable, AIChatLogs, AdminLoader (skeleton)
│   ├── ui/                  # Badge, Button, Card, Input (kiểu shadcn tự viết)
│   └── CatChatbot.tsx       # Widget Sigma Cat, đọc SSE từ /api/ai/chat/stream
├── lib/
│   ├── api.ts               # API_BASE_URL = '/api' (luôn relative), ContentApi, ContactApi
│   ├── contentCache.ts      # cache localStorage "content-cache:v2:*", useCachedContent()
│   └── utils.ts             # cn() = clsx + tailwind-merge
└── store/
    ├── authStore.ts         # token JWT trong localStorage['token']
    └── adminThemeStore.ts   # dark/light cho admin
```

`public/` chứa: `cv.pdf`, ảnh profile/logo, favicon các cỡ, `robots.txt`, `sitemap.xml`, `site.webmanifest`, file xác minh Google Search Console, `oneko.js` + `oneko.gif` (mèo chạy theo chuột).

`index.html` chứa sẵn: meta SEO/OpenGraph, JSON-LD (Person, WebSite, ProfilePage, FAQPage), boot splash và nội dung HTML fallback cho Googlebot.

## 3. Quy ước

- Gọi API luôn bằng đường dẫn relative `/api/...` — dev thì Vite proxy sang `localhost:5000`, prod thì nginx của container frontend proxy sang `backend:8080`.
- Trang public: dữ liệu qua `useCachedContent(key, fallback, isValid)` — luôn có fallback hardcode để không bao giờ trống.
- Admin: dùng `useQuery` với key `profile | experiences | skills | projects | inbox | ai-sessions`; sau khi ghi thì `invalidateQueries`. (Cache `localStorage` của trang public tự làm mới ở lần tải sau nhờ stale-while-revalidate.)
- Admin được code-split thành **một** bundle lazy để visitor không tải về.
- Chatbot: `sessionId` lưu `localStorage['ai_chat_session_id']`, có honeypot `websiteTrap`.

## 4. Nginx của container (`nginx.conf`)

| Location | Việc làm |
| :--- | :--- |
| `/api/ai/` | rate limit POST 20 r/phút, tắt buffering cho SSE, timeout 120s |
| `= /api/contact/messages` | rate limit POST 5 r/phút |
| `= /api/auth/login` | rate limit POST 10 r/phút |
| `/api/` | proxy thường |
| `/assets/` | cache 1 năm immutable (file có hash) |
| file tĩnh khác | cache 1 ngày + stale-while-revalidate |
| `/login`, `/dashboard` | `X-Robots-Tag: noindex` |
| `/` | SPA fallback `index.html`, `no-cache` |

## 5. Lệnh

```bash
cd src/Web/frontend
npm install
npm run dev      # http://localhost:5173, proxy /api → localhost:5000
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
```
