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

# Parameters optimized for accurate, punchy, conversational CPU inference
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.05
PARAMETER repeat_last_n 32
PARAMETER num_predict 65
PARAMETER num_ctx 1024
PARAMETER num_thread 4
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

# Baked Enterprise Knowledge & Persona
SYSTEM """
$systemContent
"""
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($targetModelfile, $modelfileContent, $utf8NoBom)
Write-Host "Successfully generated UTF-8 (No BOM) Modelfile for Sigma Cat at: $targetModelfile"
