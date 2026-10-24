# build-model.ps1 - Assembles knowledge and triggers 'ollama create sigma-cat' inside Docker

$scriptDir = $PSScriptRoot
$assembleScript = Join-Path $scriptDir "assemble.ps1"

# 1. Assemble Markdown into Modelfile
& $assembleScript

# 2. Trigger Ollama create command inside the running portfolio_ollama container
Write-Host "Creating custom model 'sigma-cat' in Ollama container..."
docker exec -i portfolio_ollama ollama create sigma-cat -f /ai/Modelfile

# Also register meo-code as an alias for complete backward compatibility
docker exec -i portfolio_ollama ollama cp sigma-cat meo-code

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: Model 'sigma-cat' (and alias 'meo-code') has been successfully created and registered with Ollama!" -ForegroundColor Green
} else {
    Write-Host "`nFAILED: Could not create model in Ollama." -ForegroundColor Red
}
