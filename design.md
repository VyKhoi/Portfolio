SYSTEM DESIGN SPECIFICATION: DARK CYBER ARCHITECT PORTFOLIO

Document Type: AI Context / System Prompt Reference
Style Manifesto: Dark Minimalist, Modern Industrial, High Contrast, Technical Precision.
Target Audience: Tech Recruiters, Engineering Managers, Enterprise Clients.

1. DESIGN PHILOSOPHY & BRAND IDENTITY

Nam tính & Hiện đại (Industrial & Modern): Thiết kế vuông vức, cấu trúc rõ ràng, sử dụng viền sắc nét (border-1), không mềm yếu, không đường cong dư thừa (rounded-md tối đa 8px).

Không màu mè (Clean & Focused): Nền tối sâu dứt khoát. Dùng 90% tông màu trầm (Black, Dark Slate, Zinc) và chỉ sử dụng 1-2 màu Accent công nghệ (Cyber Lime & Ice Cyan) để điểm nhấn thông tin quan trọng.

Độc đáo & Linh động (Technical Brutalism): Kết hợp giữa cảm giác Terminal/Code Editor và giao diện Dashboard hiện đại. Sử dụng font chữ Monospace cho dữ liệu/số liệu và font chữ hình khối cho tiêu đề.

2. DESIGN TOKENS & TAILWIND CSS V4 CONFIG

Tất cả các màu sắc, font chữ và khoảng cách phải tuân thủ chuẩn Tailwind v4 @theme dưới đây:

@import "tailwindcss";

@theme {
  /* Typography */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Urbanist', sans-serif;

  /* Surface Colors */
  --color-main: #0A0A0C;         /* Matte Black (Nền chính) */
  --color-card: #121215;         /* Dark Slate (Thẻ nội dung) */
  --color-card-hover: #18181C;   /* Hover state cho thẻ */
  --color-border: #27272A;       /* Border chính (Zinc 800) */
  --color-border-bright: #3F3F46;/* Border nổi bật khi focus/hover */

  /* Text Colors */
  --color-text-main: #FFFFFF;    /* Chữ chính */
  --color-text-muted: #A1A1AA;   /* Chữ phụ (Zinc 400) */

  /* Accents (Dùng tối giản, có kiểm soát) */
  --color-lime: #DEFF9A;         /* Primary Accent (Cyber Lime) */
  --color-cyan: #00E5FF;         /* Secondary Accent (Ice Cyan) */
  --color-rose: #F43F5E;         /* Status / Danger Accent */
}

/* Custom Utilities */
.bg-grid-pattern {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}


3. UI/UX RULES & COMPONENT ANATOMY

3.1 Quy tắc chung (Visual Mechanics)

Hình khối: Dùng rounded-md (6px) hoặc rounded-lg (8px). TẬP TRUNG TỐI ĐA vào viền (border border-[#27272A]), không dùng rounded-2xl hay rounded-3xl.

Đổ bóng & Glossy: TUYỆT ĐỐI KHÔNG dùng box-shadow mờ nhòe lớn hoặc hiệu ứng Glossy/Glassmorphism quá đà.

Hover States: Khi hover vào bất cứ Card hay Button nào, phản hồi phải dứt khoát: Viền sáng lên (hover:border-[#DEFF9A] hoặc hover:border-[#00E5FF]), background chuyển nhẹ (bg-[#18181C]).

3.2 Cấu trúc Chi Tiết Cho Từng Component

A. Glass Navigation Bar (Navbar.jsx)

Layout: Fixed Top, backdrop-blur-md bg-[#0A0A0C]/80, border-b border-[#27272A].

Left: Terminal Indicator DEV.PORTFOLIO // [ONLINE] font var(--font-mono) kèm bg-green-500 animate-pulse dot.

Center: Nav links uppercase, font var(--font-mono) (#projects, #architecture, #metrics, #contact). Hover đổi màu text-[#DEFF9A].

Right: Button DOWNLOAD CV dạng sharp outline viền màu #DEFF9A, text màu #DEFF9A, hover fill màu #DEFF9A text đen.

B. Hero Section (HeroSection.jsx)

Layout: Desktop 2 Cột (Căn trái dứt khoát, không căn giữa).

Left Column:

Status Badge: [SYSTEM_READY] SENIOR FULLSTACK & MICROSERVICES ARCHITECT (font Mono, viền #27272A, text #DEFF9A).

Big Headline: XÂY DỰNG HỆ THỐNG MỞ RỘNG, HIỆU SUẤT CAO & CHUẨN ENTERPRISE (Font Space Grotesk, chữ MỞ RỘNG highlight màu #DEFF9A).

Sub-text: 2 câu về C# .NET Core, Microservices, Kafka, Redis, React.

CTA Buttons:

Primary: XEM DỰ ÁN (Background #DEFF9A, text đen, font-bold).

Secondary: KIẾN TRÚC HỆ THỐNG (Border #00E5FF, text #00E5FF).

Right Column (Interactive Code Terminal Mockup):

Top bar: 3 nút tròn window (đỏ/vàng/xanh), title bar: yarp-gateway-config.json.

Code block: Hiển thị JSON/C# YARP Proxy routing với syntax highlighting sắc nét.

C. Projects Bento Grid (ProjectsBento.jsx)

Layout: Asymmetric Bento Grid 3 Cards.

Card 1 (Main Featured - Chiếm 2 Cột):

Tên dự án: Microservices Portfolio Platform (.NET 9, YARP Gateway, Kafka, Redis, MySQL).

Feature Tag: EVENT-DRIVEN ARCHITECTURE.

Technical Metrics: Badge < 50ms Latency, Kafka Event-Driven.

Image: Mockup kiến trúc hệ thống góc cạnh.

Card 2 & 3 (1 Cột):

Dự án SaaS Analytics Dashboard & Realtime Chat Gateway.

Card Interaction: Click mở Modal xem chi tiết (selectedProject từ Zustand Store). Hover phát sáng viền.

D. Architecture Flow Diagram (TechArchitecture.jsx)

Goal: Trực quan hóa tư duy Microservices.

Component 1 (Interactive Visual Flow):

Sơ đồ luồng: [React SPA] -> [YARP Gateway] -> [Services (Identity / Content / Contact)] -> [Kafka] -> [Notification Worker].

Mỗi Node là một khối Card nhỏ màu #121215, viền #27272A. Khi hover vào Node nào thì Node đó sáng viền Cyan/Lime.

Component 2 (Tech Matrix Grid 3 Cột):

Col 1: Core Backend (C#, ASP.NET Core, EF Core, YARP Gateway).

Col 2: Async Messaging & Cache (Apache Kafka, Redis Distributed Cache).

Col 3: Frontend & DevOps (React 19, Tailwind v4, Docker, MySQL).

E. High-Impact Metrics (MetricsMindset.jsx)

Layout: Grid 3 Cột Card tối giản.

Metrics:

99.9% - UPTIME & RESILIENCE MINDSET (Handled Gateway Failover, Polly Retry).

< 50ms - LATENCY OPTIMIZATION (Redis Distributed Cache-Aside).

100% - CONTAINERIZED (Docker Compose & Ready for Kubernetes).

Style: Số cực lớn (Space Grotesk, font-bold, màu #DEFF9A), label mờ font Mono.

F. Contact Form / Event Producer (ContactSection.jsx)

Left Column: Direct Contact Info (Email, GitHub, LinkedIn) + Button Copy Email 1-click.

Right Column (Form):

Inputs: Dark Background #121215, viền #27272A, focus border #DEFF9A, no soft shadows.

Submit Button: GỬI TIN NHẮN [KAFKA EVENT].

States: Trigger Zustand state isContactLoading bật spinner và hiển thị Terminal Notification Toast khi gửi thành công.

G. Admin Console Dashboard (/admin/dashboard)

Theme: Dark Terminal Dashboard.

Components: Sidebar navigation, Inbox Table (Danh sách Contact Messages từ contact_db), Project CRUD Modal.

4. STRICT RULES FOR AI CODE GENERATION (MUST FOLLOW)

DO NOT use soft colored shadows (e.g., shadow-xl, shadow-lime-500/50). Use crisp borders (border border-[#27272A] hover:border-[#DEFF9A]).

DO NOT use rounded bubbles (rounded-full or rounded-3xl) for cards or containers. Maximum radius is rounded-md or rounded-lg.

DO NOT create multi-colored gradients on text unless specified. Keep contrast high with pure white text and sharp accent colors.

ALWAYS use JetBrains Mono for badges, tags, code blocks, metrics, and terminal elements.

ALWAYS ensure responsive design works flawlessly on mobile (stack 1 column) and desktop (multi-column grids).