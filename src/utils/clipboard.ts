/**
 * Universal clipboard utility for Helpy / Natively.
 *
 * Provides a resilient multi-tier copy mechanism:
 * 1. Native Electron clipboard API via window.electronAPI.writeClipboardText
 *    (Immune to window focus restrictions, no-activate policies, and permissions).
 * 2. Modern Web Clipboard API (navigator.clipboard.writeText).
 * 3. Classic DOM fallback via hidden textarea and document.execCommand('copy').
 */

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof text !== 'string') {
    text = String(text ?? '');
  }
  if (!text) return false;

  // 1. Electron Native Clipboard (Primary for desktop overlay/frameless windows)
  try {
    if (window.electronAPI && typeof window.electronAPI.writeClipboardText === 'function') {
      const success = await window.electronAPI.writeClipboardText(text);
      if (success !== false) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[Clipboard] Electron native writeText failed, attempting web fallback:', err);
  }

  // 2. Modern Web Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[Clipboard] navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
  }

  // 3. Document execCommand fallback (Universal browser fallback)
  try {
    if (typeof document !== 'undefined' && document.body) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // Ensure the textarea is not visible but part of the active DOM
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textArea);

      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    }
  } catch (err) {
    console.warn('[Clipboard] execCommand fallback failed:', err);
  }

  return false;
}

export async function readTextFromClipboard(): Promise<string> {
  // 1. Electron Native Clipboard
  try {
    if (window.electronAPI && typeof window.electronAPI.readClipboardText === 'function') {
      return await window.electronAPI.readClipboardText();
    }
  } catch (err) {
    console.warn('[Clipboard] Electron native readText failed:', err);
  }

  // 2. Modern Web Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      return await navigator.clipboard.readText();
    }
  } catch (err) {
    console.warn('[Clipboard] navigator.clipboard.readText failed:', err);
  }

  return '';
}
