# src/Portfolio.AI — tính cách và câu cố định của Sigma Cat

**Sigma Cat là nhân vật riêng có tính cách sigma, trợ lý của anh Khôi, không phải anh Khôi.** Tự tin, ít lời, hài khô, không nịnh, không giọng tổng đài. Tính cách chỉ ở giọng nói; sự thật lấy từ dữ liệu, không thổi phồng, hạn chế nhắc Masan.

| File | Vai trò |
| :--- | :--- |
| `persona.md` | Phần đầu system prompt: danh tính, tính cách, quy tắc. Viết tiếng Anh cho ít token. Câu trả lời: 1 câu đủ ý, tối đa 2, khoảng 20-35 từ |
| `replies.json` | Thông báo hệ thống vi + en (quota, bận, lỗi...), không lưu vào DB |
| `evals/questions.json` | Bộ đánh giá cho `scripts/eval-sigma.py` |

Hai file đầu được copy vào `ai/` cạnh API khi build. Không có Modelfile: API gọi thẳng `qwen3:4b-instruct` với prompt dựng từ DB (`ChatPromptBuilder`).

## Cập nhật
- **Thông tin về anh Khôi:** sửa trong admin (Profile, Experience, Skills, tab Sigma Cat). Có hiệu lực ở tin kế tiếp, không cần deploy.
- **Tính cách / quy tắc:** sửa `persona.md`, chạy eval trên server trước khi deploy:
  ```bash
  python3 scripts/eval-sigma.py --persona /path/to/persona.md
  ```
  Script lấy facts hiện tại qua `dotnet Portfolio.API.dll --print-prompt` trong container backend. Tính cách máy không chấm hết được: đọc mẫu trong `eval-results.json` rồi nhờ Khôi duyệt.
- **Không có câu trả lời soạn sẵn:** mọi câu trả lời do model sinh ra. `replies.json` chỉ chứa thông báo hệ thống.
