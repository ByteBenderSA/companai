export type AIProvider = 'gemini' | 'deepseek';

export type AIErrorKind =
  | 'missing-key'
  | 'invalid-key'
  | 'rate-limit'
  | 'model-unavailable'
  | 'blocked'
  | 'bad-response'
  | 'network'
  | 'unknown';

/** A provider error translated into something a student can act on. */
export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly provider: AIProvider;
  /** True when the fix is in Settings (key or model), so the UI can offer a shortcut. */
  readonly fixInSettings: boolean;

  constructor(kind: AIErrorKind, provider: AIProvider, message?: string) {
    super(message ?? describe(kind, provider));
    this.name = 'AIError';
    this.kind = kind;
    this.provider = provider;
    this.fixInSettings = kind === 'missing-key' || kind === 'invalid-key' || kind === 'model-unavailable';
  }
}

const PROVIDER_NAME: Record<AIProvider, string> = { gemini: 'Gemini', deepseek: 'DeepSeek' };

export function describe(kind: AIErrorKind, provider: AIProvider): string {
  const name = PROVIDER_NAME[provider];
  switch (kind) {
    case 'missing-key':
      return `Add your ${name} API key in Settings to use AI features.`;
    case 'invalid-key':
      return `Your ${name} API key was rejected. Check it in Settings — it may be mistyped or revoked.`;
    case 'rate-limit':
      return `${name} says you've hit your usage limit. Wait a minute and try again (free keys allow a limited number of requests per minute and per day).`;
    case 'model-unavailable':
      return `The ${name} model isn't available for your key. Open Settings and clear the model field to use the default, or pick a newer model.`;
    case 'blocked':
      return `${name} declined to answer this request. Try rephrasing it.`;
    case 'bad-response':
      return `${name} sent back something we couldn't read. Please try again.`;
    case 'network':
      return `Couldn't reach ${name}. Check your internet connection and try again.`;
    case 'unknown':
      return `Something went wrong talking to ${name}. Please try again.`;
  }
}

function statusOf(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status: unknown }).status;
    if (typeof s === 'number') return s;
  }
  return undefined;
}

/** Map any thrown value from a provider SDK / fetch into an AIError. */
export function classifyAIError(err: unknown, provider: AIProvider): AIError {
  if (err instanceof AIError) return err;

  const status = statusOf(err);
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();

  if (status === 401 || status === 403 || /api key not valid|invalid api key|api_key_invalid|permission_denied|unauthorized|authentication fails/.test(lower)) {
    return new AIError('invalid-key', provider);
  }
  if (status === 429 || /resource_exhausted|quota|rate limit|too many requests/.test(lower)) {
    return new AIError('rate-limit', provider);
  }
  if (status === 404 || /not found for api version|is not found|model_not_found|does not exist|no longer available|has been (shut down|deprecated)/.test(lower)) {
    return new AIError('model-unavailable', provider);
  }
  if (/safety|blocked|recitation|prohibited/.test(lower)) {
    return new AIError('blocked', provider);
  }
  if (err instanceof TypeError && /fetch|network|load failed/.test(lower)) {
    return new AIError('network', provider);
  }
  if (/failed to fetch|networkerror|network request failed|err_internet_disconnected/.test(lower)) {
    return new AIError('network', provider);
  }
  if (status !== undefined && status >= 500) {
    return new AIError('unknown', provider, `${PROVIDER_NAME[provider]} is having trouble right now (error ${status}). Try again in a moment.`);
  }
  return new AIError('unknown', provider);
}
