@echo off
echo ========================================================
echo   Launching NEXUS: Autonomous AI Software Engineering Team
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting FastAPI Backend on http://localhost:8000 ...
start "Nexus Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Next.js Frontend on http://localhost:3000 ...
start "Nexus Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Nexus Dashboard in your default browser ...
start http://localhost:3000

echo.
echo ========================================================
echo   Nexus is now running!
echo   Dashboard:  http://localhost:3000
echo   API Docs:   http://localhost:8000/docs
echo ========================================================
