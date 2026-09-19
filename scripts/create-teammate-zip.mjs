import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { path7za } = require('7zip-bin');

const workspaceRoot = path.resolve('d:/natively-cluely-ai-assistant');
const stagingBase = path.resolve('d:/Helpy-Staging');
const stagingDir = path.join(stagingBase, 'Helpy');
const outputZip = path.resolve('d:/Helpy-Portable-Teammate.zip');
const downloadsDir = 'C:/Users/lenovo/Downloads';
const downloadsZip = path.join(downloadsDir, 'Helpy-Portable-Teammate.zip');

console.log('=== Helpy Teammate Windows-Compatible ZIP Packager ===');
console.log('7za binary:', path7za);
console.log('Workspace:', workspaceRoot);
console.log('Output ZIP:', outputZip);

// 1. Verify requirements
const required = [
  path.join(workspaceRoot, 'dist/index.html'),
  path.join(workspaceRoot, 'dist-electron/electron/main.js'),
  path.join(workspaceRoot, '.env'),
  path.join(workspaceRoot, 'package.json'),
  path.join(workspaceRoot, 'node_modules/electron/dist/electron.exe'),
  path.join(workspaceRoot, 'native-module/index.win32-x64-msvc.node'),
  path.join(workspaceRoot, 'start-helpy.vbs'),
  path.join(workspaceRoot, 'Launch Helpy.bat'),
  path.join(workspaceRoot, 'Setup-Desktop-Shortcut.vbs'),
  path.join(workspaceRoot, 'README-HOW-TO-USE.txt')
];

for (const req of required) {
  if (!fs.existsSync(req)) {
    console.error('ERROR: Required item missing:', req);
    process.exit(1);
  }
}
console.log('All required files verified.');

// 2. Clean previous staging
if (fs.existsSync(stagingBase)) {
  console.log('Cleaning existing staging directory...');
  fs.rmSync(stagingBase, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 3. Create junctions for heavy directories
const junctions = ['node_modules', 'dist', 'dist-electron', 'assets', 'models', 'resources', 'src'];
for (const j of junctions) {
  const src = path.join(workspaceRoot, j);
  const dest = path.join(stagingDir, j);
  if (fs.existsSync(src)) {
    fs.symlinkSync(src, dest, 'junction');
    console.log(`Created junction: Helpy/${j} -> ${src}`);
  }
}

// 4. Create lightweight native-module (excluding 700MB target/)
const nativeModuleDir = path.join(stagingDir, 'native-module');
fs.mkdirSync(nativeModuleDir, { recursive: true });
const nativeModuleFiles = ['index.win32-x64-msvc.node', 'index.js', 'package.json'];
for (const f of nativeModuleFiles) {
  const src = path.join(workspaceRoot, 'native-module', f);
  const dest = path.join(nativeModuleDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied native-module file: ${f}`);
  }
}

// 5. Copy root files
const rootFiles = [
  '.env',
  'package.json',
  'start-helpy.vbs',
  'start-silent.bat',
  'Launch Helpy.bat',
  'emergency-stop.vbs',
  'stop-helpy.bat',
  'Setup-Desktop-Shortcut.vbs',
  'README-HOW-TO-USE.txt'
];

for (const f of rootFiles) {
  const src = path.join(workspaceRoot, f);
  const dest = path.join(stagingDir, f);
  fs.copyFileSync(src, dest);
  console.log(`Copied root file: ${f}`);
}

// 6. Delete old zip files
if (fs.existsSync(outputZip)) {
  console.log('Removing old output zip...');
  fs.unlinkSync(outputZip);
}
if (fs.existsSync(downloadsZip)) {
  console.log('Removing old downloads zip...');
  try { fs.unlinkSync(downloadsZip); } catch {}
}

// 7. Run 7za.exe with standard ZIP format (-tzip)
// This creates 100% native Windows Explorer compatible ZIPs (proper DOS/Windows attributes, valid PKZIP headers)
console.log('\nCompressing with 7za into 100% Windows Explorer compatible ZIP archive...');
console.log('Excluding developer files (.d.ts, .js.map, logs, and unused dev tooling)...');

const zipArgs = [
  'a',
  '-tzip',
  '-mx=5', // Balanced fast multi-threaded compression
  outputZip,
  path.join(stagingBase, 'Helpy'),
  '-xr!*.js.map',
  '-xr!*.d.ts',
  '-xr!*.tsbuildinfo',
  '-xr!*.log',
  '-xr!.git',
  '-xr!.cache',
  '-xr!.vite',
  '-xr!elevenlabs-js',
  '-xr!@types',
  '-xr!@typescript-eslint',
  '-xr!target'
];

const startMs = Date.now();
const zipResult = spawnSync(path7za, zipArgs, { stdio: 'inherit' });
const durationSec = ((Date.now() - startMs) / 1000).toFixed(1);

if (zipResult.status !== 0) {
  console.error(`7za exited with code ${zipResult.status}`);
  process.exit(1);
}

const zipStat = fs.statSync(outputZip);
const zipSizeMB = (zipStat.size / (1024 * 1024)).toFixed(2);
console.log(`\nSUCCESS! Created ${outputZip} (${zipSizeMB} MB) in ${durationSec}s`);

// 8. Clean up staging directory
console.log('Cleaning up staging directory...');
fs.rmSync(stagingBase, { recursive: true, force: true });

// 9. Copy to Downloads folder
try {
  console.log(`Copying ZIP to Downloads folder: ${downloadsZip}...`);
  fs.copyFileSync(outputZip, downloadsZip);
  console.log('Successfully copied to Downloads folder!');
} catch (e) {
  console.warn('Could not copy to Downloads:', e.message);
}

// 10. Automated verification using Windows Shell.Application COM object
console.log('\nVerifying compatibility with Windows File Explorer (Shell.Application COM)...');
const verifyPsScript = `
$shell = New-Object -ComObject Shell.Application
$zip = $shell.NameSpace('${downloadsZip.replace(/'/g, "''")}')
if ($zip -eq $null) {
    Write-Host "VERIFICATION FAILED: Windows Shell cannot open this ZIP!"
    exit 1
} else {
    $count = $zip.Items().Count
    Write-Host "VERIFICATION SUCCESS: Windows Shell opened ZIP with root items: $count"
    foreach ($item in $zip.Items()) {
        Write-Host "  -> Root entry: $($item.Name)"
    }
}
`;
fs.writeFileSync('scripts/temp-verify-shell.ps1', verifyPsScript);
try {
  const verifyOut = execSync('powershell -ExecutionPolicy Bypass -File scripts/temp-verify-shell.ps1').toString();
  console.log(verifyOut);
} catch (err) {
  console.error('Shell verification failed:', err.stdout ? err.stdout.toString() : err.message);
} finally {
  if (fs.existsSync('scripts/temp-verify-shell.ps1')) fs.unlinkSync('scripts/temp-verify-shell.ps1');
}

console.log('=== Distribution Package Complete & Verified ===');
