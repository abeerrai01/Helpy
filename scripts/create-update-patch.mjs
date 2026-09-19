import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { path7za } = require('7zip-bin');

const workspaceRoot = path.resolve('d:/natively-cluely-ai-assistant');
const stagingBase = path.resolve('d:/Helpy-Patch-Staging');
const stagingDir = path.join(stagingBase, 'Helpy-Update');
const outputZip = path.resolve('d:/Helpy-Update-Patch.zip');
const downloadsDir = 'C:/Users/lenovo/Downloads';
const downloadsZip = path.join(downloadsDir, 'Helpy-Update-Patch.zip');

console.log('=== Creating Helpy Lightweight Update Patch ===');

// 1. Verify requirements
const required = [
  path.join(workspaceRoot, 'dist/index.html'),
  path.join(workspaceRoot, 'dist-electron/electron/main.js'),
  path.join(workspaceRoot, 'start-helpy.vbs')
];

for (const req of required) {
  if (!fs.existsSync(req)) {
    console.error('ERROR: Required item missing:', req);
    process.exit(1);
  }
}

// 2. Clean previous staging
if (fs.existsSync(stagingBase)) {
  fs.rmSync(stagingBase, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 3. Create junctions for dist and dist-electron
fs.symlinkSync(path.join(workspaceRoot, 'dist'), path.join(stagingDir, 'dist'), 'junction');
fs.symlinkSync(path.join(workspaceRoot, 'dist-electron'), path.join(stagingDir, 'dist-electron'), 'junction');

// 4. Copy start-helpy.vbs
fs.copyFileSync(path.join(workspaceRoot, 'start-helpy.vbs'), path.join(stagingDir, 'start-helpy.vbs'));

// 5. Create 1-click bulletproof Apply-Update.bat script
const applyUpdateBat = `@echo off
setlocal enabledelayedexpansion
title Helpy Updater
echo ========================================================
echo              Helpy 1-Click Update Installer
echo ========================================================
echo.

:: 1. Detect Helpy installation folder
set "TARGET_DIR="
if exist "node_modules\\electron" (
    set "TARGET_DIR=%cd%"
) else if exist "..\\node_modules\\electron" (
    pushd ..
    set "TARGET_DIR=!cd!"
    popd
) else if exist "%USERPROFILE%\\Downloads\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Downloads\\Helpy"
) else if exist "%USERPROFILE%\\Desktop\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Desktop\\Helpy"
)

if "%TARGET_DIR%"=="" (
    echo Could not automatically find your Helpy folder.
    echo Please copy this entire update folder inside your Helpy folder
    echo and run Apply-Update.bat again.
    echo.
    pause
    exit /b 1
)

echo Found Helpy directory: %TARGET_DIR%
echo.
echo 1. Stopping any running Helpy processes...
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

echo 2. Updating application code...
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%Helpy-Update\\dist" (
    set "SRC_DIR=%SCRIPT_DIR%Helpy-Update"
) else if exist "%SCRIPT_DIR%dist" (
    set "SRC_DIR=%SCRIPT_DIR%"
) else (
    echo Error: Update files not found.
    pause
    exit /b 1
)

if exist "%TARGET_DIR%\\dist" rmdir /S /Q "%TARGET_DIR%\\dist" >nul 2>&1
if exist "%TARGET_DIR%\\dist-electron" rmdir /S /Q "%TARGET_DIR%\\dist-electron" >nul 2>&1

xcopy /E /Y /I "%SRC_DIR%\dist" "%TARGET_DIR%\dist" >nul
xcopy /E /Y /I "%SRC_DIR%\dist-electron" "%TARGET_DIR%\dist-electron" >nul
if exist "%SRC_DIR%\start-helpy.vbs" copy /Y "%SRC_DIR%\start-helpy.vbs" "%TARGET_DIR%\start-helpy.vbs" >nul

echo 3. Refreshing launcher shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $s1 = $ws.CreateShortcut((Join-Path $d 'Launch Helpy.lnk')); $s1.TargetPath = (Join-Path '%TARGET_DIR%' 'start-helpy.vbs'); $s1.WorkingDirectory = '%TARGET_DIR%'; if (Test-Path (Join-Path '%TARGET_DIR%' 'node_modules\\electron\\dist\\electron.exe')) { $s1.IconLocation = (Join-Path '%TARGET_DIR%' 'node_modules\\electron\\dist\\electron.exe') + ',0'; }; $s1.Save(); $dl = Join-Path $env:USERPROFILE 'Downloads'; $s2 = $ws.CreateShortcut((Join-Path $dl 'Launch Helpy.lnk')); $s2.TargetPath = (Join-Path '%TARGET_DIR%' 'start-helpy.vbs'); $s2.WorkingDirectory = '%TARGET_DIR%'; if (Test-Path (Join-Path '%TARGET_DIR%' 'node_modules\\electron\\dist\\electron.exe')) { $s2.IconLocation = (Join-Path '%TARGET_DIR%' 'node_modules\\electron\\dist\\electron.exe') + ',0'; }; $s2.Save();" >nul 2>&1

echo.
echo ========================================================
echo   SUCCESS: Helpy has been successfully updated!
echo   All new fixes and features are installed.
echo   Desktop and Downloads shortcuts have been updated.
echo   You can now launch Helpy as usual!
echo ========================================================
echo.
pause
`;
fs.writeFileSync(path.join(stagingBase, 'Apply-Update.bat'), applyUpdateBat, 'utf8');

// 6. Delete old zip files
if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);
if (fs.existsSync(downloadsZip)) {
  try { fs.unlinkSync(downloadsZip); } catch {}
}

// 7. Compress using 7za
console.log('Compressing update patch (excluding sourcemaps)...');
const zipArgs = [
  'a',
  '-tzip',
  '-mx=5',
  outputZip,
  path.join(stagingBase, 'Helpy-Update'),
  path.join(stagingBase, 'Apply-Update.bat'),
  '-xr!*.map',
  '-xr!*.tsbuildinfo',
  '-xr!*.log'
];

const startMs = Date.now();
const zipResult = spawnSync(path7za, zipArgs, { stdio: 'inherit' });
const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

if (zipResult.status !== 0) {
  console.error(`7za exited with code ${zipResult.status}`);
  process.exit(1);
}

const zipStat = fs.statSync(outputZip);
const zipSizeMB = (zipStat.size / (1024 * 1024)).toFixed(1);
console.log(`\nCreated update patch: ${outputZip} (${zipSizeMB} MB) in ${durationSec}s`);

// 8. Clean up staging directory
fs.rmSync(stagingBase, { recursive: true, force: true });

// 9. Copy to Downloads folder
try {
  console.log(`Copying update patch to Downloads: ${downloadsZip}...`);
  fs.copyFileSync(outputZip, downloadsZip);
  console.log('SUCCESS! Update patch is ready in your Downloads folder:');
  console.log('-> ' + downloadsZip);
} catch (e) {
  console.warn('Could not copy to Downloads:', e.message);
}
