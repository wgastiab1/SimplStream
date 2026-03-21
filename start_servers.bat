@echo off
title WilStream Servers Launcher
echo ===================================================
echo   Iniciando servidores de WilStream...
echo ===================================================

echo.
echo [1/2] Levantando backend (FastAPI)...
start "WilStream Backend" cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Levantando frontend (Vite)...
start "WilStream Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Los servidores se iniciaron en ventanas separadas.
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:5173
echo ===================================================
pause
