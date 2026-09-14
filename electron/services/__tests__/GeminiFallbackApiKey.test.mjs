import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Module from 'node:module';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'gemini-fallback-test-'));
const fakeElectron = {
  app: { getPath: () => userData, isPackaged: false, getVersion: () => '0.0.0-test' },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: (s) => Buffer.from(s),
    decryptString: (b) => Buffer.from(b).toString('utf8'),
    getSelectedStorageBackend: () => 'basic_text',
  },
};

const origLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === 'electron') return fakeElectron;
  return origLoad.apply(this, arguments);
};

const { CredentialsManager } = require('../CredentialsManager');
const { LLMHelper } = require('../../LLMHelper');

test('CredentialsManager gathers fallback Gemini keys from environment', () => {
  const cm = CredentialsManager.getInstance();
  const fallbacks = cm.getGeminiFallbackApiKeys();
  assert.ok(Array.isArray(fallbacks), 'returns an array');
  if (process.env.GEMINI_API_KEY_2) {
    assert.ok(fallbacks.includes(process.env.GEMINI_API_KEY_2), 'includes GEMINI_API_KEY_2 from environment');
  }
  assert.ok(!fallbacks.includes(cm.getGeminiApiKey()), 'does not duplicate primary key');
});

test('LLMHelper initializes fallback clients from constructor and setters', () => {
  const helper = new LLMHelper(
    undefined,
    false,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    ['test-fallback-key-1', 'test-fallback-key-2']
  );

  assert.equal(helper.getGeminiFallbackClientCount(), 2, 'two fallback clients initialized');
  assert.equal(helper.hasGemini(), true, 'hasGemini() is true via fallback client');
  assert.ok(helper.getGeminiClient() !== null, 'getGeminiClient() returns robust proxy client');

  helper.setGeminiFallbackApiKey('test-fallback-key-1');
  assert.equal(helper.getGeminiFallbackClientCount(), 1, 'single fallback client after setGeminiFallbackApiKey');

  helper.setGeminiFallbackApiKey('');
  assert.equal(helper.getGeminiFallbackClientCount(), 0, 'cleared fallback clients on empty string');
  assert.equal(helper.hasGemini(), false, 'hasGemini() false when both primary and fallbacks are absent');
});
