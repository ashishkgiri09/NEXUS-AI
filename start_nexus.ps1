Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching NEXUS: Autonomous AI Software Engineering Team" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "[1/3] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[3/3] Opening Nexus Dashboard in browser ..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "Nexus is running!" -ForegroundColor Green
Write-Host "Dashboard:  http://localhost:3000" -ForegroundColor White
Write-Host "API Docs:   http://localhost:8000/docs" -ForegroundColor White
