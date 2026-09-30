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
const downloadsAllUpdatesZip = path.join(downloadsDir, 'Helpy-All-Updates-Patch.zip');

console.log('=== Creating Helpy Cumulative Lightweight Update Patch ===');
console.log('Packaging all updates from the initial 1 GB portable base release till now...');

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

// 4. Copy launcher scripts and helper utilities
const rootFiles = [
  'start-helpy.vbs',
  'Launch Helpy.bat',
  'emergency-stop.vbs',
  'stop-helpy.bat',
  'Setup-Desktop-Shortcut.vbs',
  'README-HOW-TO-USE.txt'
];

for (const f of rootFiles) {
  const src = path.join(workspaceRoot, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stagingDir, f));
    console.log(`Included root file: ${f}`);
  }
}

// Also include icon if exists
const iconSrc = path.join(workspaceRoot, 'assets/icons/win/icon.ico');
if (fs.existsSync(iconSrc)) {
  const iconDestDir = path.join(stagingDir, 'assets/icons/win');
  fs.mkdirSync(iconDestDir, { recursive: true });
  fs.copyFileSync(iconSrc, path.join(iconDestDir, 'icon.ico'));
  console.log('Included assets/icons/win/icon.ico');
}

// 5. Create 1-click bulletproof Apply-Update.bat script
const applyUpdateBat = `@echo off
setlocal enabledelayedexpansion
title Helpy Cumulative Update Installer
echo ========================================================
echo        Helpy Cumulative Update Installer
echo        (Applies all updates from base 1 GB release)
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
) else if exist "Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%cd%\\Helpy"
) else if exist "%USERPROFILE%\\Downloads\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Downloads\\Helpy"
) else if exist "%USERPROFILE%\\Downloads\\Helpy-Portable-Teammate\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Downloads\\Helpy-Portable-Teammate\\Helpy"
) else if exist "%USERPROFILE%\\Desktop\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Desktop\\Helpy"
) else if exist "%USERPROFILE%\\Desktop\\Helpy-Portable-Teammate\\Helpy\\node_modules\\electron" (
    set "TARGET_DIR=%USERPROFILE%\\Desktop\\Helpy-Portable-Teammate\\Helpy"
)

if "!TARGET_DIR!"=="" (
    echo Could not automatically find your Helpy folder.
    set /p "TARGET_DIR=Please enter or drag-and-drop the path to your Helpy folder: "
    set TARGET_DIR=!TARGET_DIR:"=!
)

if not exist "!TARGET_DIR!\\node_modules\\electron" (
    echo.
    echo ERROR: Helpy directory not found at: "!TARGET_DIR!"
    echo Please make sure you extracted the base 1 GB Helpy zip first,
    echo then run Apply-Update.bat again.
    echo.
    pause
    exit /b 1
)

echo Found Helpy directory: !TARGET_DIR!
echo.
echo 1. Stopping any running Helpy processes...
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

echo 2. Applying all cumulative updates...
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

if exist "!TARGET_DIR!\\dist" rmdir /S /Q "!TARGET_DIR!\\dist" >nul 2>&1
if exist "!TARGET_DIR!\\dist-electron" rmdir /S /Q "!TARGET_DIR!\\dist-electron" >nul 2>&1

xcopy /E /Y /I "%SRC_DIR%\\dist" "!TARGET_DIR%\\dist" >nul
xcopy /E /Y /I "%SRC_DIR%\\dist-electron" "!TARGET_DIR%\\dist-electron" >nul

if exist "%SRC_DIR%\\assets" (
    xcopy /E /Y /I "%SRC_DIR%\\assets" "!TARGET_DIR%\\assets" >nul 2>&1
)

for %%f in (start-helpy.vbs "Launch Helpy.bat" emergency-stop.vbs stop-helpy.bat Setup-Desktop-Shortcut.vbs README-HOW-TO-USE.txt) do (
    if exist "%SRC_DIR%\\%%~f" copy /Y "%SRC_DIR%\\%%~f" "!TARGET_DIR%\\%%~f" >nul 2>&1
)

echo 3. Refreshing launcher shortcuts...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [Environment]::GetFolderPath('Desktop'); $dl = Join-Path $env:USERPROFILE 'Downloads'; $target = '!TARGET_DIR!'; $icon = Join-Path $target 'assets\\icons\\win\\icon.ico'; if (-not (Test-Path $icon)) { $icon = (Join-Path $target 'node_modules\\electron\\dist\\electron.exe') + ',0' } else { $icon = $icon + ',0' }; $vbs = Join-Path $target 'start-helpy.vbs'; $stopVbs = Join-Path $target 'emergency-stop.vbs'; foreach ($loc in @($d, $dl)) { $s1 = $ws.CreateShortcut((Join-Path $loc 'Helpy.lnk')); $s1.TargetPath = 'wscript.exe'; $s1.Arguments = ('\\\"' + $vbs + '\\\"'); $s1.WorkingDirectory = $target; $s1.IconLocation = $icon; $s1.Description = 'Helpy - AI Interview & Productivity Assistant'; $s1.Save(); $s2 = $ws.CreateShortcut((Join-Path $loc 'Stop Helpy.lnk')); $s2.TargetPath = 'wscript.exe'; $s2.Arguments = ('\\\"' + $stopVbs + '\\\"'); $s2.WorkingDirectory = $target; $s2.IconLocation = ($env:SystemRoot + '\\\\System32\\\\shell32.dll,131'); $s2.Description = 'Stop all background Helpy processes'; $s2.Save(); }" >nul 2>&1

echo.
echo ========================================================
echo   SUCCESS: All Helpy updates have been installed!
echo.
echo   Included Updates:
echo   - Fix interviewer voice listening (16kHz loopback lock)
echo   - Isolate current question only (no repeated past questions)
echo   - Model selector & settings popover window z-order
echo   - Multi-LLM API key fallback resilience
echo   - 1-Click Desktop & Downloads shortcuts
echo.
echo   You can now launch Helpy using the Desktop shortcut!
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
if (fs.existsSync(downloadsAllUpdatesZip)) {
  try { fs.unlinkSync(downloadsAllUpdatesZip); } catch {}
}

// 7. Compress using 7za
console.log('Compressing cumulative update patch (excluding sourcemaps and secrets)...');
const zipArgs = [
  'a',
  '-tzip',
  '-mx=5',
  outputZip,
  path.join(stagingBase, 'Helpy-Update'),
  path.join(stagingBase, 'Apply-Update.bat'),
  '-xr!*.map',
  '-xr!*.tsbuildinfo',
  '-xr!*.log',
  '-xr!.env*'
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

// 9. Copy to Downloads folder (both Helpy-Update-Patch.zip and Helpy-All-Updates-Patch.zip)
try {
  console.log(`Copying update patch to Downloads: ${downloadsZip}...`);
  fs.copyFileSync(outputZip, downloadsZip);
  fs.copyFileSync(outputZip, downloadsAllUpdatesZip);
  console.log('SUCCESS! Cumulative update patch is ready in your Downloads folder:');
  console.log('-> ' + downloadsZip);
  console.log('-> ' + downloadsAllUpdatesZip);
} catch (e) {
  console.warn('Could not copy to Downloads:', e.message);
}
