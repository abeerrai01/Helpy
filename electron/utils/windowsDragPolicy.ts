import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

let isConfigured = false;

/**
 * On Windows, if "Show window contents while dragging" (DragFullWindows) is disabled (0),
 * Windows DWM / USER32 draws a 1px wireframe outline box on the desktop during window moves.
 * Because that wireframe is drawn directly on the desktop DC by USER32, it bypasses
 * SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) and appears on screen shares/recordings.
 *
 * Enabling DragFullWindows (1) ensures Windows moves the protected window live with its contents
 * intact, which DWM completely excludes from capture — leaving no visible border or outline.
 */
export function ensureWindowsFullDrag(): void {
  if (process.platform !== 'win32') return;
  if (isConfigured) return;
  isConfigured = true;

  try {
    const candidatePaths = [
      path.join(app.getAppPath(), 'scripts', 'set-drag-full.ps1'),
      path.resolve(__dirname, '../../scripts/set-drag-full.ps1'),
      path.resolve(process.cwd(), 'scripts/set-drag-full.ps1'),
    ];
    const scriptPath = candidatePaths.find(p => fs.existsSync(p));

    if (scriptPath) {
      exec(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${scriptPath}"`, (err) => {
        if (err) {
          console.warn('[WindowsDragPolicy] Failed to execute set-drag-full.ps1:', err.message);
        } else {
          console.log('[WindowsDragPolicy] DragFullWindows enabled (prevents wireframe border during moves)');
        }
      });
    } else {
      exec(`powershell -NoProfile -NonInteractive -Command "Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name 'DragFullWindows' -Value '1'"`, (err) => {
        if (err) {
          console.warn('[WindowsDragPolicy] Failed to set DragFullWindows via powershell fallback:', err.message);
        } else {
          console.log('[WindowsDragPolicy] DragFullWindows set to 1 via fallback');
        }
      });
    }
  } catch (err: any) {
    console.warn('[WindowsDragPolicy] Error ensuring full window drag:', err?.message || err);
  }
}
