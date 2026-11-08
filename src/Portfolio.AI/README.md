# Portfolio.AI

Sigma Cat 😼 is Khoi's assistant on the website, a cat with its own personality rather than a copy of him.

| File | Purpose |
| :--- | :--- |
| `persona.md` | Identity, personality and rules: the first part of the system prompt |
| `replies.json` | System messages in English and Vietnamese |
| `evals/questions.json` | Questions scored by `scripts/eval-sigma.py` |

Facts about Khoi live in the database and are edited in the admin console. The API builds the prompt on every message and calls `qwen3:4b-instruct` through Ollama, so edits apply without a deploy.
