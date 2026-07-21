@echo off
REM ============================================
REM  Jewellery CRM - STOP ALL
REM  Stops frontend, backend, database, redis.
REM ============================================

title Jewellery CRM - Stopper

set "WORKSPACE=%~dp0"
cd /d "%WORKSPACE%"

echo.
echo ==============================================
echo   🛑 Jewellery CRM - Stopping Everything...
echo ==============================================
echo.

REM ---- 1. Stop Docker containers (backend + postgres + redis) ----
echo [1/3] Stopping Docker containers (Backend + Postgres + Redis)...
cd /d "%WORKSPACE%backend-fixed"
docker compose down
echo     Done.
echo.

REM ---- 2. Kill node processes running on port 3000 (frontend) ----
echo [2/3] Stopping Frontend (Next.js dev server on port 3000)...
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul
echo     Done.
echo.

REM ---- 3. Close any CMD windows titled "Jewellery CRM - ..." ----
echo [3/3] Closing CRM windows...
powershell -Command "Get-Process cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like 'Jewellery CRM -*' } | ForEach-Object { $_.CloseMainWindow() | Out-Null }" 2>nul
echo     Done.
echo.

REM ---- Optional: stop Docker Desktop (comment out if you want to keep Docker running) ----
REM echo [Optional] Stopping Docker Desktop...
REM "C:\Program Files\Docker\Docker\Docker Desktop.exe" stop
REM timeout /t 5 /nobreak >nul

echo ==============================================
echo   ✅ All Jewellery CRM services stopped.
echo.
echo   - Backend containers are stopped
echo   - Frontend server is stopped
echo   - Your data is safely saved for next time
echo ==============================================
echo.
pause
