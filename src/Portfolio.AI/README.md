# 🧠 Portfolio.AI - Local AI knowledge

This folder holds the knowledge base, persona and configuration of the local AI model (**Sigma Cat 😼**) used by the Portfolio website. The knowledge files are in Vietnamese because the chatbot answers in Vietnamese.

## 📁 Structure

```text
src/Portfolio.AI/
├── knowledge/               # Markdown files that teach the AI
│   ├── profile.md           # Personal details, education, contact
│   ├── experience.md        # Work experience and projects
│   ├── skills.md            # Skills and tech stack
│   └── guidelines.md        # Sigma Cat persona and reply rules
├── Modelfile                # Generated model definition
├── scripts/
│   ├── assemble.ps1         # Merges the Markdown files into the Modelfile
│   ├── build-model.ps1      # Builds the 'sigma-cat' model on Windows
│   └── build-model.sh       # Builds the 'sigma-cat' model on Linux/Docker
└── README.md
```

## 🚀 Updating the AI's knowledge (no C# changes needed)

1. Edit the matching files in `knowledge/`.
2. Regenerate the `Modelfile` and rebuild the model:
   - Windows PowerShell:
     ```powershell
     .\scripts\build-model.ps1
     ```
   - Or, with an up-to-date `Modelfile`, directly through Docker:
     ```bash
     docker exec -i portfolio_ollama ollama create sigma-cat -f /ai/Modelfile
     ```
3. Commit both `knowledge/` and `Modelfile`: CI only runs `ollama create` on the committed `Modelfile`.

The `sigma-cat` model picks up the new knowledge right away, with no backend restart or rebuild. Answers hardcoded in Fast Intent (`Controllers/AIController.cs`) are separate and need their own edit.
