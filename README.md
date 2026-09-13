# Helpy — Setup Guide

> Real-time AI meeting assistant with live transcription, smart answers, and context intelligence.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone and Install](#2-clone-and-install)
3. [Configure API Keys](#3-configure-api-keys)
4. [Build and Run](#4-build-and-run)
5. [In-App Settings](#5-in-app-settings)
6. [Troubleshooting](#6-troubleshooting)
7. [API Key Quick Reference](#7-api-key-quick-reference)

---

## 1. Prerequisites

### Required Software

| Tool     | Version    | Download                          |
|----------|------------|-----------------------------------|
| Node.js  | >= 22.6.0  | https://nodejs.org/en/download    |
| Git      | Any        | https://git-scm.com/downloads     |

> **Windows users:** After installing Node.js, restart your terminal/PowerShell before proceeding.

Verify your installation:
```bash
node --version   # Should print v22.x.x or higher
npm --version    # Should print 10.x.x or higher
```

---

## 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/abeerrai01/Helpy.git
cd Helpy

# Install all dependencies (downloads Electron, native modules, AI binaries)
npm install
```

> `npm install` may take 3-5 minutes on the first run.

---

## 3. Configure API Keys

Copy the environment file and fill in your keys:

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` in any text editor (VS Code, Notepad, etc.) and set the values below.

---

### A. LLM — Gemini (Recommended — Free)

Gemini powers all AI answers, summaries, and chat responses.

**Steps:**
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API key**
3. Copy the key (starts with `AIza...`)

In your `.env`:
```env
GEMINI_API_KEY=AIzaSy...your_key_here
GOOGLE_API_KEY=AIzaSy...your_key_here
DEFAULT_MODEL=gemini-3.8-flash
GEMINI_PREFERRED_MODEL=gemini-3.8-flash
```

Free tier: 1,500 requests/day — more than enough for daily meetings.

---

### B. LLM — OpenRouter (Multi-model)

OpenRouter lets you use GPT-4o, Claude, Llama, Mistral, and more through a single key.

**Steps:**
1. Go to https://openrouter.ai/keys
2. Click **Create Key**
3. Copy the key (starts with `sk-or-v1-...`)

In your `.env`:
```env
OPENAI_API_KEY=sk-or-v1-...your_key_here
```

OpenRouter gives $1 free credit on signup. Many models (Llama, Mistral) are completely free.

Popular free models on OpenRouter:

| Model                                    | Speed     | Quality   |
|------------------------------------------|-----------|-----------|
| meta-llama/llama-3.3-70b-instruct        | Fast      | Excellent |
| google/gemini-flash-1.5                  | Very Fast | Very Good |
| mistralai/mistral-7b-instruct            | Fast      | Good      |

---

### C. Speech-to-Text — Deepgram (Best for Indian English)

Deepgram Nova-3 provides the best accuracy for Indian English, handles technical vocabulary, and streams with under 200 ms latency.

**Steps:**
1. Go to https://deepgram.com and click Sign Up (no credit card required)
2. From the dashboard, click **API Keys** then **Create a New API Key**
3. Copy the key (40-character hex string)

In your `.env`:
```env
DEEPGRAM_API_KEY=your_40_char_key_here
```

Free: $200 in credits upon signup — lasts months of daily use.

Why Deepgram for Indian English?
- Trained on diverse global accents including South Asian English
- Handles software engineering vocabulary (React Native, algorithm, two sum)
- Real-time streaming with no buffering delay
- Handles code-switching and technical jargon naturally

---

### D. Speech-to-Text — Groq (Free and Accurate)

Groq runs OpenAI Whisper Large v3 (1.5B parameters) — extremely accurate for all accents, completely free.

**Steps:**
1. Go to https://console.groq.com and sign up or log in
2. Click **API Keys** then **Create API Key**
3. Copy the key (starts with `gsk_...`)

In your `.env`:
```env
GROQ_API_KEY=gsk_...your_key_here
```

Completely free with generous rate limits (20 requests/min, 2,000/day).

---

### Full .env Example (Recommended Setup)

```env
# LLM (AI Answers)
GEMINI_API_KEY=AIzaSy_your_gemini_key
GOOGLE_API_KEY=AIzaSy_your_gemini_key
DEFAULT_MODEL=gemini-3.8-flash
GEMINI_PREFERRED_MODEL=gemini-3.8-flash

# For multi-model access via OpenRouter
OPENAI_API_KEY=sk-or-v1-your_openrouter_key

# Speech-to-Text (set BOTH if you want, switch between them in Settings)
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=gsk_your_groq_key

# Optional providers
ELEVENLABS_API_KEY=your_elevenlabs_key_here
AZURE_SPEECH_KEY=your_azure_key_here
AZURE_SPEECH_REGION=eastus
```

---

## 4. Build and Run

### Development Mode (Recommended for first run)

```bash
npm run electron:dev
```

This compiles both the frontend and Electron main process then launches the app.

### Quick Run (if dist is already built)

```bash
npx electron .
```

### Production Build

```bash
npm run build:electron
npx electron .
```

---

## 5. In-App Settings

After the app opens, click the Settings icon in the top-right corner.

### Configure Speech-to-Text Provider

1. Go to Settings then Audio
2. Under Speech-to-Text Provider, select Deepgram or Groq
3. Paste your API key in the input field
4. Click Save and Test — you should see a green Connected badge
5. Under Recognition Language, select English (India) for best Indian English accuracy

### Configure LLM Provider

1. Go to Settings then AI Providers
2. Enter your Gemini API Key (or OpenRouter key)
3. Select your preferred model such as gemini-3.8-flash
4. Click Save

### Start a Meeting Session

1. Click Record or use the hotkey (Ctrl+Shift+R on Windows)
2. The app captures your microphone and system audio
3. Live transcript appears in real-time on screen
4. Use What to Answer, Clarify, or Recap for AI assistance

---

## 6. Troubleshooting

### STT reconnecting badge keeps showing

Cause: Speech provider cannot connect — wrong or missing API key, or insufficient free RAM.

Fix:
1. Go to Settings then Audio and re-enter your API key
2. Click Save and Test to validate the connection
3. If using Local Whisper, close other apps to free RAM (needs at least 2 GB free)

---

### Transcription is inaccurate or produces wrong words

Cause: Default Tiny English local Whisper model only understands native US English.

Fix:
- Switch to Deepgram in Settings (Provider: Deepgram)
- Or switch to Groq (free Whisper Large v3, much more accurate)
- Set Recognition Language to English (India)

---

### npm install fails with native module errors

Cause: Missing C++ build tools.

Fix on Windows:
```bash
npm install --global windows-build-tools
# Or install Desktop development with C++ from Visual Studio Installer
```

Fix on macOS:
```bash
xcode-select --install
```

---

### App shows a blank white screen

Cause: Frontend was not built before running Electron.

Fix:
```bash
npm run build:electron
npx electron .
```

---

### Gemini API returns 429 Too Many Requests

Cause: Free tier rate limit reached.

Fix:
- Wait 60 seconds and retry
- Add an OpenRouter key as a fallback in Settings then AI Providers
- Or upgrade at https://aistudio.google.com/pricing

---

### Whisper model fails to load or shows model not found

Cause: Downloaded model files are corrupt (partial download or failed extraction).

Fix — run this in your terminal to purge corrupt files:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const base = process.env.APPDATA || (process.env.HOME + '/Library/Application Support');
const dir = path.join(base, 'natively', 'whisper-models', 'distil-whisper', 'distil-large-v3');
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Purged corrupt model. Re-download in Settings > Audio.');
} else {
  console.log('Directory not found — nothing to purge.');
}
"
```

Then go to Settings then Audio and re-download the model.

---

## 7. API Key Quick Reference

| Service    | Purpose                    | Free Tier       | Sign Up URL                              |
|------------|----------------------------|-----------------|------------------------------------------|
| Gemini     | AI answers and summaries   | 1,500 req/day   | https://aistudio.google.com/app/apikey  |
| OpenRouter | Multi-model LLM gateway    | $1 credit        | https://openrouter.ai/keys              |
| Deepgram   | Live STT (Indian English)  | $200 credit      | https://deepgram.com                    |
| Groq       | Live STT (Whisper Large)   | 2,000 req/day   | https://console.groq.com                |
| ElevenLabs | Live STT (alternative)     | Limited          | https://elevenlabs.io                   |

---

## Recommended Setup for Indian English Users

```
LLM  : Gemini  (free, fast, great for Indian technical context)
STT  : Deepgram Nova-3  ->  Language: English (India)
Model: gemini-3.8-flash  (best speed-to-quality ratio)
```

This combination delivers:
- Perfect transcription of Indian English accents and technical terms
- Sub-200 ms real-time voice recognition
- Smart AI answers with full meeting context awareness
- No local GPU or high-end hardware required

---

Built for interview prep, technical meetings, and daily productivity.
