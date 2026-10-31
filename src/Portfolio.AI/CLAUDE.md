# src/Portfolio.AI — kiến thức & persona cho chatbot Sigma Cat

Không có code chạy — chỉ là nguyên liệu để tạo model Ollama `sigma-cat`.

| File | Vai trò |
| :--- | :--- |
| `knowledge/guidelines.md` | Persona (mèo trợ lý, xưng "em", nói về anh Khôi ở ngôi thứ 3, 1–2 câu, cấm gạch đầu dòng) + mẫu hỏi đáp |
| `knowledge/profile.md`, `experience.md`, `skills.md` | Dữ kiện về Khôi (rất ngắn) |
| `Modelfile` | **Được sinh ra** từ knowledge: `FROM qwen2.5:1.5b`, PARAMETER (`temperature 0.3`, `num_predict 65`, `num_ctx 1024`, `num_thread 4`...), `SYSTEM """..."""` |
| `scripts/assemble.ps1` | Ghép knowledge → Modelfile (Windows) |
| `scripts/build-model.ps1` | assemble + `docker exec portfolio_ollama ollama create sigma-cat` + alias `meo-code` |
| `scripts/build-model.sh` | Bản Linux (tự chứa phần ghép) |

Thư mục này được mount vào container ollama tại `/ai`.

## Quy trình cập nhật
1. Sửa `knowledge/*.md`.
2. Chạy `assemble.ps1` (hoặc `build-model.sh`) để sinh lại `Modelfile`.
3. Commit **cả knowledge và Modelfile** — CI chỉ chạy `ollama create sigma-cat -f /ai/Modelfile`, không tự ghép.
4. Nếu đổi dữ kiện hay được hỏi → sửa luôn `TryGetFastIntentReply` trong `Controllers/AIController.cs`.

Không sửa tay `Modelfile` (sẽ bị ghi đè lần ghép sau). Test: `docker exec -it portfolio_ollama ollama run sigma-cat "khôi là ai"`.
