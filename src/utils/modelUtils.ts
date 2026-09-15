export const STANDARD_CLOUD_MODELS: Record<string, {
    hasKeyCheck: (creds: any) => boolean;
    ids: string[];
    names: string[];
    descs: string[];
    pmKey: 'geminiPreferredModel' | 'groqPreferredModel' | 'openrouterPreferredModel';
}> = {
    gemini: {
        hasKeyCheck: (creds) => !!creds?.hasGeminiKey,
        ids: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'],
        names: ['Gemini 3.8 Flash', 'Gemini 3.1 Flash Lite', 'Gemini 3.1 Pro'],
        descs: ['Fastest • Multimodal', 'Fast • Multimodal', 'Reasoning • High Quality'],
        pmKey: 'geminiPreferredModel'
    },
    openrouter: {
        hasKeyCheck: (creds) => !!creds?.hasOpenRouterKey,
        ids: [
            'openrouter/free',
            'google/gemma-4-31b-it:free',
            'nvidia/nemotron-3.5-lightning:free',
            'inclusionai/ling-3.0-flash-vl:free',
        ],
        names: [
            'Auto Free (OpenRouter)',
            'Gemma 4 31B (OpenRouter)',
            'Nemotron 3.5 (OpenRouter)',
            'Ling 3.0 Flash VL (OpenRouter)',
        ],
        descs: [
            'Free • Auto Routed',
            'Free • High Quality',
            'Free • Reasoning',
            'Free • Multimodal',
        ],
        pmKey: 'openrouterPreferredModel'
    },
    groq: {
        hasKeyCheck: (creds) => !!creds?.hasGroqKey,
        ids: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
        names: ['Groq Qwen 3.8', 'Groq GPT-OSS 120B', 'Groq GPT-OSS 20B'],
        descs: ['Ultra Fast • Multimodal', 'Highest Quality • Text-only', 'Fastest • Text-only'],
        pmKey: 'groqPreferredModel'
    },
};

// The id stays 'codex-cli' (persisted in settings and routing), but the provider
// is not a CLI: Natively calls the ChatGPT Codex backend with its own ChatGPT
// sign-in and never runs the `codex` binary (issue #558).
export const CODEX_CLI_MODEL = {
    id: 'codex-cli',
    name: 'OpenAI Codex',
    desc: 'ChatGPT sign-in',
};

/**
 * Built-in Codex models, used when the user has no Codex CLI catalogue to read
 * (see codexModelOptions) — which is most users, since Natively does not need
 * the CLI. Also the name source for surfaces that only have a selector id
 * (getCodexCliModelDisplayName).
 *
 * Each one answered a live request with a ChatGPT sign-in on 2026-09-11. The
 * previous gpt-5.4 / gpt-5.3-codex / gpt-5.3-codex-spark presets are rejected
 * for a ChatGPT account (CHATGPT_UNSUPPORTED_CODEX_MODELS in
 * electron/services/CodexModelCatalog.ts); a test keeps the two apart.
 */
export const CODEX_CLI_MODEL_PRESETS = [
    { id: 'gpt-5.5', name: 'ChatGPT 5.5' },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra' },
    { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna' },
];

/** Result of the `codex-cli:models` IPC — CodexModelCatalog in the main process. */
export interface CodexModelCatalogResult {
    source: 'codex-cli' | 'unavailable';
    models: { id: string; name: string }[];
    fetchedAt?: string;
    clientVersion?: string;
}

/**
 * The Codex models to offer: the installed Codex CLI's own catalogue when one
 * was found, otherwise the built-in presets. `undefined`/`null` covers an older
 * preload without the IPC.
 */
export const codexModelOptions = (catalog: CodexModelCatalogResult | null | undefined): { id: string; name: string }[] =>
    catalog?.source === 'codex-cli' && catalog.models.length > 0 ? catalog.models : CODEX_CLI_MODEL_PRESETS;

export const codexCliSelectorId = (modelId: string): string => `codex-cli:${modelId}`;

export const getCodexCliModelDisplayName = (id: string): string | null => {
    if (id === CODEX_CLI_MODEL.id) return CODEX_CLI_MODEL.name;
    if (!id.startsWith('codex-cli:')) return null;

    const modelId = id.slice('codex-cli:'.length);
    const preset = CODEX_CLI_MODEL_PRESETS.find(model => model.id === modelId);
    return preset?.name || prettifyModelId(modelId);
};

export const prettifyModelId = (id: string): string => {
    if (!id) return '';
    return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Providers whose model allow-list is OPT-IN: an empty list means NOTHING is
 * selected, not "everything".
 *
 * Every other provider ships a curated handful of preset models, so "empty =
 * all" is the right default there and stays. A LiteLLM gateway fronts the
 * upstream's entire catalogue — 300+ models is normal — and defaulting that to
 * "all" floods the meeting-overlay picker with a list nobody chose.
 *
 * MIRRORED in ipcHandlers.ts modelAvailable(). The two must agree: this one
 * decides what the user can pick, that one decides what routing will accept.
 * A drift guard test pins them together.
 */
export const isOptInModelProvider = (provider: string): boolean => provider === 'litellm';

/**
 * Does `modelId` survive `provider`'s allow-list?
 *
 * The single definition of the allow-list contract, so the settings panel, the
 * meeting-overlay picker and routing cannot disagree about what "empty" means.
 */
export const isModelAllowed = (provider: string, modelId: string, allowList: string[]): boolean => {
    // Opt-in: nothing is permitted until the user ticks it.
    if (isOptInModelProvider(provider)) return allowList.includes(modelId);
    // Everyone else: empty means no filter at all.
    return allowList.length === 0 || allowList.includes(modelId);
};

/**
 * The display label for a LiteLLM-proxied model.
 *
 * TWO prefixes stack on these ids, and neither is identity:
 *   1. `litellm/` — Natively's own routing prefix. providerFamily() and
 *      modelAvailable() (ipcHandlers.ts) key off it, so it can never be
 *      dropped from the ID; it just has no business being on screen.
 *   2. `<upstream>/` — the PROXY's own model id. Most LiteLLM configs name
 *      models `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`, `bedrock/...`,
 *      so a raw id reads `litellm/openai/gpt-4o`.
 *
 * The label is therefore the LAST segment. Accepts prefixed and bare ids
 * alike, because the two callers hold different forms: the picker and the
 * allow-list hold `litellm/<id>`, while the discovery cache
 * (getAvailableLiteLLMModels) holds the proxy's `<id>` verbatim.
 *
 * Deliberately NOT prettifyModelId(): that is built for our own hyphenated
 * ids and mangles proxy ids — `bedrock/anthropic.claude-v2` came out as
 * "Bedrock/Anthropic.Claude V2". A proxy model id is a literal the user typed
 * into their own config, so it renders verbatim.
 *
 * KNOWN, ACCEPTED: two upstreams can expose the same model name, so
 * `openai/gpt-4o` and `azure/gpt-4o` both label as "gpt-4o" and are
 * indistinguishable in a list. Showing the bare name was chosen with that
 * trade-off understood; disambiguating is a change to this one function.
 */
export const litellmModelLabel = (id: string): string => {
    if (!id) return '';
    const segments = id.replace(/^litellm\//, '').split('/').filter(Boolean);
    // Degenerate ids ("litellm/", "///") keep the input rather than becoming
    // an empty label — a blank row is worse than an ugly one.
    return segments.length ? segments[segments.length - 1] : id;
};
