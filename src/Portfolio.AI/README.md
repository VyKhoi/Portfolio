# Portfolio.AI

Sigma Cat 😼 is Khoi's assistant on the website, a cat with its own personality rather than a copy of him.

| File | Purpose |
| :--- | :--- |
| `persona.md` | Identity, personality and rules: the first part of the system prompt |
| `replies.json` | System messages in English and Vietnamese |
| `quick-answers.json` | Instant replies for exact known questions, with `{{key}}` placeholders filled from the database |
| `evals/questions.json` | Questions scored by `scripts/eval-sigma.py` |

Facts about Khoi live in the database and are edited in the admin console. The API builds the prompt on every message and calls `qwen3.5:4b` through Ollama, so edits apply without a deploy.
