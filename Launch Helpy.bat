@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo   Starting Helpy AI Assistant...
echo ===================================================
echo.
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" "%~dp0."
) else (
    start wscript.exe "%~dp0start-helpy.vbs"
)
exit
