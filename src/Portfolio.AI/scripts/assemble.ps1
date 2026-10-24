# assemble.ps1 - Assembles Markdown knowledge files into an Ollama Modelfile

$aiDir = Split-Path -Parent $PSScriptRoot
$knowledgeDir = Join-Path $aiDir "knowledge"
$targetModelfile = Join-Path $aiDir "Modelfile"

Write-Host "Assembling knowledge documents from $knowledgeDir..."

$guidelines = Get-Content (Join-Path $knowledgeDir "guidelines.md") -Raw -Encoding UTF8
$profile = Get-Content (Join-Path $knowledgeDir "profile.md") -Raw -Encoding UTF8
$experience = Get-Content (Join-Path $knowledgeDir "experience.md") -Raw -Encoding UTF8
$skills = Get-Content (Join-Path $knowledgeDir "skills.md") -Raw -Encoding UTF8

$systemContent = @"
$guidelines

---

$profile

---

$experience

---

$skills
"@

$systemContent = $systemContent.Trim()

$modelfileContent = @"
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
$systemContent
"""
"@

[System.IO.File]::WriteAllText($targetModelfile, $modelfileContent, [System.Text.Encoding]::UTF8)
Write-Host "Successfully generated UTF-8 Modelfile for Sigma Cat at: $targetModelfile"
