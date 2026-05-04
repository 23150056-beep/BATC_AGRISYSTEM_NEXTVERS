@echo off
title BATC System Launcher
echo ================================================
echo   BATC Agricultural Management System
echo   Starting servers...
echo ================================================
echo.

REM Start Django backend in its own window
start "BATC Backend (Django)" cmd /k "cd /d C:\Users\User\Desktop\agri_sys_next_ver\batc\batc-backend && call venv\Scripts\activate && python manage.py runserver"

REM Wait 3 seconds then start the frontend
timeout /t 3 /nobreak >nul

REM Start Vite frontend in its own window
start "BATC Frontend (Vite)" cmd /k "cd /d C:\Users\User\Desktop\agri_sys_next_ver\batc\batc-frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo.
echo To STOP the servers, close the two terminal windows
echo (BATC Backend and BATC Frontend).
echo.
pause
