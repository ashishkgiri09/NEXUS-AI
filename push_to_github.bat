@echo off
echo ========================================================
echo   Pushing NEXUS to GitHub: akshithreddy0402/nexus
echo ========================================================
echo.

cd /d "%~dp0"

git remote set-url origin https://github.com/akshithreddy0402/nexus.git
git branch -M main

echo Attempting git push to https://github.com/akshithreddy0402/nexus.git ...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Project published to:
    echo   https://github.com/akshithreddy0402/nexus
    echo ========================================================
) else (
    echo.
    echo --------------------------------------------------------
    echo If the push failed with 404, please create an empty repo
    echo named 'nexus' at: https://github.com/new
    echo then run this script again!
    echo --------------------------------------------------------
)

pause
