import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('CSS rules permit text selection and cursor for AI responses', () => {
  const cssPath = path.resolve(process.cwd(), 'src/index.css');
  const content = fs.readFileSync(cssPath, 'utf8');

  // Verify text selection is explicitly allowed on ai-response-card and markdown-content
  assert.match(content, /\.ai-response-card[\s\S]*?user-select:\s*text\s*!important/);
  assert.match(content, /\.markdown-content[\s\S]*?user-select:\s*text\s*!important/);

  // Verify text cursor exception when not undetectable
  assert.match(content, /:root:not\(\[data-undetectable="true"\]\)\s*\.ai-response-card p[\s\S]*?cursor:\s*text\s*!important/);
});

test('IPC clipboard handler is registered in ipcHandlers.ts and preload bridge', () => {
  const ipcPath = path.resolve(process.cwd(), 'electron/ipcHandlers.ts');
  const ipcContent = fs.readFileSync(ipcPath, 'utf8');
  assert.match(ipcContent, /safeHandle\('clipboard:write-text'/);
  assert.match(ipcContent, /clipboard\.writeText/);

  const preloadPath = path.resolve(process.cwd(), 'electron/preload.ts');
  const preloadContent = fs.readFileSync(preloadPath, 'utf8');
  assert.match(preloadContent, /writeClipboardText:\s*async\s*\(text:\s*string\)/);
  assert.match(preloadContent, /ipcRenderer\.invoke\('clipboard:write-text',\s*text\)/);
});

test('clipboard utility provides electron IPC and fallback mechanisms', () => {
  const utilPath = path.resolve(process.cwd(), 'src/utils/clipboard.ts');
  const utilContent = fs.readFileSync(utilPath, 'utf8');
  assert.match(utilContent, /export async function copyTextToClipboard/);
  assert.match(utilContent, /window\.electronAPI\.writeClipboardText/);
  assert.match(utilContent, /navigator\.clipboard\.writeText/);
  assert.match(utilContent, /document\.execCommand\('copy'\)/);
});

test('start-helpy.vbs correctly launches without runaway and points to workspace', () => {
  const vbsPath = path.resolve(process.cwd(), 'start-helpy.vbs');
  const vbsContent = fs.readFileSync(vbsPath, 'utf8');
  assert.match(vbsContent, /node_modules\\\.bin\\electron\.cmd/);
  assert.match(vbsContent, /WshShell\.CurrentDirectory/);
});
