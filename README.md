# 🚀 Khoi's Portfolio & Tech Playground

Chào mừng bạn đến với mã nguồn Portfolio cá nhân của mình — **Đặng Vỹ Khôi**! 👋

Dự án này là trang cá nhân kết hợp lab nhỏ để mình vừa làm sản phẩm phục vụ công việc, vừa vọc vạch và thực hành các công nghệ backend / frontend mình yêu thích.

---

## 📸 Demo

| Trang Chủ | Trợ Lý AI Sigma Cat | Admin Dashboard |
| :---: | :---: | :---: |
| ![Home](docs/images/home.png) | ![Chat](docs/images/chat.png) | ![Admin](docs/images/admin.png) |

---

## 🛠️ Tech Stack & Tính Năng

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS.
  - Tích hợp chatbox trợ lý AI (Sigma Cat) stream câu trả lời theo thời gian thực (SSE).
  - Easter egg: Mèo Oneko tương tác nhẹ nhàng theo chuột.
- **Backend:** .NET 9 Web API (cấu trúc Modular Monolith).
  - Tích hợp Entity Framework Core & Dapper.
  - Xử lý gửi email bất đồng bộ qua Background Worker (`System.Threading.Channels`).
  - Gửi thông báo về Telegram khi có khách nhắn tin hoặc chat với AI.
- **Cơ sở dữ liệu:** PostgreSQL 16 + pgAdmin 4 tích hợp sẵn (port 5050).
- **AI Cục Bộ (Ollama):** Chạy model `Qwen2.5:1.5B` trong Docker nội bộ.
  - System prompt định danh chú mèo trợ lý Sigma Cat (luôn nói về mình ở ngôi thứ 3, match đúng ngôn ngữ người hỏi, không chém gió ngoài dữ liệu).
- **Bảo mật cơ bản:**
  - Nginx rate-limiting chống spam request.
  - Bẫy ngầm Honeypot chặn bot tự điền form mà không làm phiền người dùng bằng CAPTCHA.

---

## 🌐 Các Cổng Dịch Vụ

| Dịch vụ | Địa chỉ | Ghi chú |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:18122` | Giao diện chính |
| **Backend API** | `http://localhost:5000/swagger` | API Swagger Docs |
| **pgAdmin 4** | `http://localhost:5050` | Quản lý PostgreSQL (`admin@khoi.dev` / `admin`) |

---

## ⚡ Chạy Thử Dự Án

### 1. Chuẩn bị môi trường
```bash
git clone https://github.com/vykhoi/Portfolio.git
cd Portfolio

cp .env.example .env
```

### 2. Khởi động Docker
```bash
# Tạo volume chứa model Ollama (chỉ cần làm lần đầu)
docker volume create ollama_models

# Build và chạy tất cả dịch vụ
docker compose up -d --build
```

### 3. Tạo model AI Sigma Cat (lần đầu chạy)
```bash
# Trên Windows PowerShell:
.\src\Portfolio.AI\scripts\build-model.ps1

# Hoặc trên Linux / macOS:
chmod +x src/Portfolio.AI/scripts/build-model.sh
./src/Portfolio.AI/scripts/build-model.sh
```

---

## 🌱 Dành Cho Khách Ghé Thăm

Bạn cứ thoải mái clone về xem code, chạy thử hoặc lấy ý tưởng để vọc vạch nhé. Code là quá trình mình học hỏi và hoàn thiện mỗi ngày, hy vọng mang lại chút niềm vui hoặc gợi ý hữu ích cho bạn! 😸

## 📬 Liên Hệ

- **Email:** [dangvykhoi@gmail.com](mailto:dangvykhoi@gmail.com)
- **Điện thoại:** 0931 314 792
- **LinkedIn:** [/in/vykhoi](https://linkedin.com/in/vykhoi)
- **GitHub:** [/vykhoi](https://github.com/vykhoi)

---
*Code with ❤️ and coffee by Khoi Dang.*
