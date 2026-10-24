# 🧠 Portfolio.AI - Dedicated Local AI Knowledge Project

Dự án này là nơi lưu trữ toàn bộ tài nguyên tri thức (Knowledge Base), Persona và cấu hình của mô hình AI Local (**Sigma Cat 😼**), phục vụ trực tiếp cho website Portfolio.

## 📁 Cấu trúc Thư mục

```text
src/Portfolio.AI/
├── knowledge/               # Nơi chứa tài liệu dạy AI (Markdown)
│   ├── profile.md           # Thông tin cá nhân, học vấn, danh hiệu, liên hệ
│   ├── experience.md        # Kinh nghiệm làm việc, dự án thực chiến
│   ├── skills.md            # Kỹ năng chuyên môn, Tech Stack
│   └── guidelines.md        # Persona Sigma Cat & quy tắc phản hồi (1-3 câu)
├── Modelfile                # File đóng gói model được sinh tự động
├── scripts/
│   ├── assemble.ps1         # Script ghép các file Markdown vào Modelfile
│   ├── build-model.ps1      # Script tự động build model 'sigma-cat' trên Windows
│   └── build-model.sh       # Script tự động build model 'sigma-cat' trên Linux/Docker
└── README.md
```

## 🚀 Cách Cập Nhật Tri Thức Mới Cho AI (Không Cần Sửa Code Backend C#)

Khi bạn muốn cập nhật CV, thêm dự án mới hoặc kỹ năng mới:

1. **Bước 1:** Mở các file tương ứng trong `knowledge/` (`experience.md`, `skills.md`...) và cập nhật nội dung.
2. **Bước 2:** Chạy script build model:
   - Trên Windows PowerShell:
     ```powershell
     .\scripts\build-model.ps1
     ```
   - Hoặc bằng lệnh Docker trực tiếp:
     ```bash
     docker exec -i portfolio_ollama ollama create sigma-cat -f /ai/Modelfile
     ```

Ngay lập tức, model `sigma-cat` trong Ollama sẽ được nạp tri thức mới. Backend `.NET` và Chatbot trên giao diện sẽ tự động phản hồi theo dữ liệu mới nhất mà **KHÔNG cần restart hay build lại Backend**!
