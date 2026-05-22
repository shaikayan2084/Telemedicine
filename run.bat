@echo off
cd /d "D:\Telemedicine\Telemedicine-Project\Telemedicine"
echo Starting Telemedicine services...

start "Backend" /B cmd /c "cd backend && node server.js > backend.log 2>&1"
timeout /t 3 /nobreak >nul

start "Signaling" /B cmd /c "cd signaling-server && node index.js > signaling.log 2>&1"
timeout /t 3 /nobreak >nul

start "Frontend" /B cmd /c "cd frontend && npm start > frontend.log 2>&1"

echo.
echo All services starting...
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Use taskkill /f /im node.exe to stop all.
