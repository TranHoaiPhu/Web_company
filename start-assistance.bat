@echo off
title AI Trip System - Assistance Page Launcher
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║   🚀 AI TRIP SYSTEM - ASSISTANCE PAGE LAUNCHER 🚀       ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Check if running in correct directory
if not exist "Chatbot" (
    echo ❌ Error: Please run this script from SE317.Q12 directory!
    echo.
    pause
    exit /b 1
)

echo 📝 Starting services...
echo.

REM Start Chatbot Server
echo [1/2] 🤖 Starting Chatbot Server (Port 5000)...
start "Chatbot Server" cmd /k "cd Chatbot && npm start"
timeout /t 5 /nobreak >nul

REM Wait for chatbot to initialize
echo.
echo ⏳ Waiting for Chatbot to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

REM Start Frontend
echo.
echo [2/2] 🌐 Starting Frontend (Port 3000)...
start "Frontend Server" cmd /k "cd ai_trip_system && npm run dev"

echo.
echo ⏳ Waiting for Frontend to start (15 seconds)...
timeout /t 15 /nobreak >nul

REM Open browser
echo.
echo 🌟 Opening browser...
start http://localhost:3000/assistance

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                   ✅ ALL SYSTEMS READY!                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📱 Services running:
echo    🤖 Chatbot Server:  http://localhost:5000
echo    🌐 Frontend:        http://localhost:3000
echo    📍 Assistance Page: http://localhost:3000/assistance
echo.
echo 💡 To stop services:
echo    - Close both terminal windows
echo    - Or press Ctrl+C in each window
echo.
echo 🎉 Happy testing!
echo.
pause
