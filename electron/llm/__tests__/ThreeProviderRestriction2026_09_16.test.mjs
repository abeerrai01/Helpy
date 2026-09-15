// electron/llm/__tests__/ThreeProviderRestriction2026_09_16.test.mjs
//
// Verifies that only three providers are exposed and configured:
// Gemini, OpenRouter, and Groq, with correct capabilities and vision flags.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const capsPath = path.resolve(repoRoot, 'dist-electron/electron/llm/modelCapabilities.js');
const { getModelCapabilities } = await import(pathToFileURL(capsPath).href);

const typesPath = path.resolve(repoRoot, 'dist-electron/electron/direct-assist/types.js');
const { DIRECT_ASSIST_PROVIDERS } = await import(pathToFileURL(typesPath).href);

describe('Three Provider Restriction: Gemini, OpenRouter, Groq', () => {
  test('DIRECT_ASSIST_PROVIDERS includes gemini, openrouter, groq', () => {
    assert.ok(DIRECT_ASSIST_PROVIDERS.includes('gemini'));
    assert.ok(DIRECT_ASSIST_PROVIDERS.includes('openrouter'));
    assert.ok(DIRECT_ASSIST_PROVIDERS.includes('groq'));
  });

  test('STANDARD_CLOUD_MODELS in modelUtils.ts only defines gemini, openrouter, groq', () => {
    const modelUtilsContent = fs.readFileSync(path.resolve(repoRoot, 'src/utils/modelUtils.ts'), 'utf8');
    const startIdx = modelUtilsContent.indexOf('export const STANDARD_CLOUD_MODELS');
    assert.ok(startIdx !== -1, 'STANDARD_CLOUD_MODELS must exist in modelUtils.ts');
    const openBrace = modelUtilsContent.indexOf('= {', startIdx);
    const endBrace = modelUtilsContent.indexOf('\n};', openBrace);
    const block = modelUtilsContent.slice(openBrace, endBrace);

    // Find top-level keys with 4 spaces indent
    const keys = [...block.matchAll(/^\s{4}([a-z_]+):\s*\{/gm)].map(m => m[1]);
    assert.deepEqual(keys.sort(), ['gemini', 'groq', 'openrouter'].sort());
  });

  test('Groq Qwen 3.8 supports images and is cloud tier', () => {
    const caps27b = getModelCapabilities('qwen/qwen3.8-27b', false);
    assert.equal(caps27b.supportsImages, true);
    assert.equal(caps27b.tier, 'cloud');

    const caps8b = getModelCapabilities('qwen/qwen3.8-8b', false);
    assert.equal(caps8b.supportsImages, true);
    assert.equal(caps8b.tier, 'cloud');
  });

  test('Groq GPT-OSS models are text only', () => {
    const caps120b = getModelCapabilities('openai/gpt-oss-120b', false);
    assert.equal(caps120b.supportsImages, false);
    assert.equal(caps120b.tier, 'cloud');

    const caps20b = getModelCapabilities('openai/gpt-oss-20b', false);
    assert.equal(caps20b.supportsImages, false);
    assert.equal(caps20b.tier, 'cloud');
  });

  test('Gemini models support images and are cloud tier', () => {
    const flash = getModelCapabilities('gemini-3.8-flash', false);
    assert.equal(flash.supportsImages, true);
    assert.equal(flash.tier, 'cloud');

    const lite = getModelCapabilities('gemini-3.1-flash-lite', false);
    assert.equal(lite.supportsImages, true);
    assert.equal(lite.tier, 'cloud');
  });

  test('OpenRouter multimodal models support images', () => {
    const lingVl = getModelCapabilities('inclusionai/ling-3.0-flash-vl:free', false);
    assert.equal(lingVl.supportsImages, true);
    assert.equal(lingVl.tier, 'cloud');
  });

  test('OpenRouter text models do not claim image support', () => {
    const gemma = getModelCapabilities('google/gemma-4-31b-it:free', false);
    assert.equal(gemma.supportsImages, false);
    assert.equal(gemma.tier, 'cloud');

    const nemotron = getModelCapabilities('nvidia/nemotron-3.5-lightning:free', false);
    assert.equal(nemotron.supportsImages, false);
    assert.equal(nemotron.tier, 'cloud');

    const router = getModelCapabilities('openrouter/free', false);
    assert.equal(router.supportsImages, false);
    assert.equal(router.tier, 'cloud');
  });
});
