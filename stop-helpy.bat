@echo off
echo Stopping Helpy background processes...
taskkill /F /IM electron.exe /T 2>nul
echo Helpy stopped successfully.
timeout /t 2 /nobreak >nul
