# ai-backend setup (Windows PowerShell)
# Requires Python 3.10+ from https://www.python.org/downloads/
# During install, check "Add python.exe to PATH".

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Find-Python {
    $candidates = @(
        (Get-Command python -ErrorAction SilentlyContinue)?.Source,
        (Get-Command py -ErrorAction SilentlyContinue)?.Source,
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates.Count -gt 0) { return $candidates[0] }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Host "Python not found. Install Python 3.10+ and enable 'Add to PATH', then run this script again." -ForegroundColor Red
    Write-Host "https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using: $python" -ForegroundColor Cyan

if (-not (Test-Path "venv")) {
    & $python -m venv venv
}

$venvPython = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r requirements.txt

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example (optional: set OPENAI_API_KEY)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Dependencies installed. Run the server:" -ForegroundColor Green
Write-Host "  .\venv\Scripts\activate" -ForegroundColor White
Write-Host "  uvicorn main:app --reload --port 8000" -ForegroundColor White
