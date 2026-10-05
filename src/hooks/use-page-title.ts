import { useEffect } from 'react';

/** Sets the browser tab title, e.g. "Projects · CompanAI". */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · CompanAI` : 'CompanAI — Turn app ideas into AI-ready prompts';
  }, [title]);
}
