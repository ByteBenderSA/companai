const STORAGE_KEY = 'companai.settings.v1';

export interface UserSettings {
  geminiApiKey: string;
  deepseekApiKey: string;
}

const DEFAULTS: UserSettings = {
  geminiApiKey: '',
  deepseekApiKey: '',
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('companai:settings-changed', { detail: updated }));
  return updated;
}

export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('companai:settings-changed', { detail: { ...DEFAULTS } }));
}

export function hasAnyApiKey(): boolean {
  const s = getSettings();
  return Boolean(s.geminiApiKey || s.deepseekApiKey);
}

export class MissingApiKeyError extends Error {
  readonly provider: 'gemini' | 'deepseek';
  constructor(provider: 'gemini' | 'deepseek') {
    super(`No ${provider} API key configured. Open Settings to add one.`);
    this.name = 'MissingApiKeyError';
    this.provider = provider;
  }
}
