import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDirectWhatToSayPayload,
  DEFAULT_SCREENSHOT_AUDIO_REQUEST,
} from '../directAssistWhatToSayPayload.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const interfaceSource = fs.readFileSync(
  path.resolve(dirname, '../../components/NativelyInterface.tsx'),
  'utf8',
);
const ipcHandlersSource = fs.readFileSync(
  path.resolve(dirname, '../../../electron/ipcHandlers.ts'),
  'utf8',
);

test('Capability 1: "What to say" takes screen content and audio, answering based on both', () => {
  const speech = 'Can you explain the architecture of this microservice?';
  const payload = buildDirectWhatToSayPayload({
    interviewerRequest: speech,
    hasScreenshots: true,
  });

  // Source is marked as screenshot, transcript carries the spoken audio,
  // and currentRequest explicitly instructs answering based on screen AND spoken audio.
  assert.equal(payload.source, 'screenshot');
  assert.equal(payload.transcript, speech);
  assert.equal(payload.currentRequest, DEFAULT_SCREENSHOT_AUDIO_REQUEST);
  assert.match(payload.currentRequest, /screen content and the spoken audio\/conversation/i);

  // In NativelyInterface.tsx, handleWhatToSay captures screen content if none attached
  assert.match(
    interfaceSource,
    /window\.electronAPI\?\.takeScreenshot\?\.\(\)/,
    'handleWhatToSay must have screen capture capability',
  );

  // handleWhatToSay captures audio snapshot and formats question card with Audio indicator
  assert.match(
    interfaceSource,
    /🎙️ Audio: "\$\{initialInterviewerSpeech\}"/,
    'Question card must show audio snippet when speech is present',
  );

  // In ipcHandlers.ts direct-assist-stream, audio is not skipped for screenshot turns with speech
  assert.match(
    ipcHandlersSource,
    /const skipAmbientAudio = \(request\.source === 'typed' && !request\.transcript\) \|\| Boolean\(\(request as any\)\.skipAudio\);/,
    'Screenshot turns with speech must not skip ambient audio',
  );
});

test('Capability 2: "Screenshot & Prompt" captures screenshot and prompts user for question', () => {
  // NativelyInterface defines handleScreenshotAndPrompt
  assert.match(
    interfaceSource,
    /const handleScreenshotAndPrompt = async \(\) => \{/,
    'handleScreenshotAndPrompt must be defined',
  );

  // It calls takeScreenshot and adds to attachedContext
  assert.match(
    interfaceSource,
    /setAttachedContext\(\(prev\) => \[\.\.\.prev, \{ path: shot\.path, preview: shot\.preview \|\| '' \}\]\.slice\(-5\)\);/,
    'handleScreenshotAndPrompt must attach the screenshot to attachedContext',
  );

  // It expands the interface and focuses the input box
  assert.match(
    interfaceSource,
    /textInputRef\.current\?\.focus\(\);/,
    'handleScreenshotAndPrompt must focus text input for user prompt',
  );

  // The Quick Actions row renders Screenshot & Prompt affordance
  assert.match(
    interfaceSource,
    /\{t\('Screenshot & Prompt'\)\}/,
    'Quick actions must include Screenshot & Prompt button',
  );

  // Placeholder prompts user what to do with the screenshot
  assert.match(
    interfaceSource,
    /What should I do with this screenshot\? Type your prompt…/,
    'Placeholder must prompt user for instructions on screenshot',
  );
});

test('Capability 3: "Prompt only" uses prompt only with no screen and no audio', () => {
  // handleManualSubmit must NOT have regex auto-capturing screenshots on words like code/problem/solve
  assert.doesNotMatch(
    interfaceSource,
    /\/\b\(screen\|screenshot\|code\|question\|problem\|solve\|this\|look\|error\|console\|window\)\b\/i\.test\(userText\)/,
    'Typed submit must NEVER auto-capture screenshots based on prompt keywords',
  );

  // When no screenshot is attached, placeholder clearly indicates prompt-only mode
  assert.match(
    interfaceSource,
    /Ask anything \(prompt only, no screen & audio\)/,
    'Placeholder must indicate prompt-only mode with no screen and no audio',
  );

  // In ipcHandlers.ts, promptOnly / skipAudio options disable live transcript injection
  assert.match(
    ipcHandlersSource,
    /!options\?\.promptOnly && !options\?\.skipAudio/,
    'gemini-chat-stream must not auto-inject live-transcript snapshot when promptOnly or skipAudio is true',
  );

  // In direct-assist-stream, typed prompt without transcript skips ambient audio
  assert.match(
    ipcHandlersSource,
    /const skipAmbientAudio = \(request\.source === 'typed' && !request\.transcript\) \|\| Boolean\(\(request as any\)\.skipAudio\);/,
    'direct-assist-stream must skip ambient audio for typed prompt-only turns',
  );
});
