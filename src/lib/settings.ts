import { useEffect, useState } from 'react';

const STORAGE_KEY = 'companai.settings.v1';
const CHANGE_EVENT = 'companai:settings-changed';

/** Default models. Providers retire models regularly; users can override these in Settings. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';

export interface UserSettings {
  geminiApiKey: string;
  deepseekApiKey: string;
  /** Empty string means "use DEFAULT_GEMINI_MODEL". */
  geminiModel: string;
}

const DEFAULTS: UserSettings = {
  geminiApiKey: '',
  deepseekApiKey: '',
  geminiModel: '',
};

export function getSettings(): UserSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULTS };
    const p = parsed as Partial<Record<keyof UserSettings, unknown>>;
    return {
      geminiApiKey: typeof p.geminiApiKey === 'string' ? p.geminiApiKey : '',
      deepseekApiKey: typeof p.deepseekApiKey === 'string' ? p.deepseekApiKey : '',
      geminiModel: typeof p.geminiModel === 'string' ? p.geminiModel : '',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const updated = { ...getSettings(), ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage can be blocked (private mode); keys then last for this page only.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: updated }));
  return updated;
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { ...DEFAULTS } }));
}

export function geminiModel(settings: UserSettings = getSettings()): string {
  return settings.geminiModel.trim() || DEFAULT_GEMINI_MODEL;
}

/** Re-renders when settings change in this tab or another tab. */
export function useSettings(): UserSettings {
  const [settings, setSettings] = useState<UserSettings>(() => getSettings());
  useEffect(() => {
    const refresh = () => setSettings(getSettings());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return settings;
}
