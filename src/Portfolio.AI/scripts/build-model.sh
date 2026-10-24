#!/usr/bin/env bash
set -e

# build-model.sh - Assembles knowledge and triggers 'ollama create sigma-cat' inside Docker
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_DIR="$(dirname "$SCRIPT_DIR")"
KNOWLEDGE_DIR="$AI_DIR/knowledge"
TARGET_MODELFILE="$AI_DIR/Modelfile"

echo "Assembling knowledge documents from $KNOWLEDGE_DIR..."

GUIDELINES=$(cat "$KNOWLEDGE_DIR/guidelines.md")
PROFILE=$(cat "$KNOWLEDGE_DIR/profile.md")
EXPERIENCE=$(cat "$KNOWLEDGE_DIR/experience.md")
SKILLS=$(cat "$KNOWLEDGE_DIR/skills.md")

cat <<EOF > "$TARGET_MODELFILE"
FROM qwen2.5:1.5b

# Parameters optimized for lively, concise inference without repetition
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.15
PARAMETER repeat_last_n 64
PARAMETER num_predict 200
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

# Baked Enterprise Knowledge & Persona
SYSTEM """
$GUIDELINES

---

$PROFILE

---

$EXPERIENCE

---

$SKILLS
"""
EOF

echo "Successfully generated Modelfile at: $TARGET_MODELFILE"
echo "Creating custom model 'sigma-cat' in Ollama container..."
docker exec -i portfolio_ollama ollama create sigma-cat -f /ai/Modelfile
docker exec -i portfolio_ollama ollama cp sigma-cat meo-code

echo "SUCCESS: Model 'sigma-cat' has been successfully created and registered with Ollama!"
