import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOpenSettings } from '@/contexts/SettingsDialogContext';
import { AIError } from '@/lib/ai/errors';

/** Error box for failed actions. AI errors that are fixed in Settings get a shortcut button. */
export function ErrorNotice({ error, onRetry, onDismiss }: { error: unknown; onRetry?: () => void; onDismiss?: () => void }) {
  const openSettings = useOpenSettings();
  const ref = useRef<HTMLDivElement>(null);

  // On phones the button that failed is often far below where the error appears; bring it into view.
  useEffect(() => {
    if (error) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  const fixInSettings = error instanceof AIError && error.fixInSettings;

  return (
    <div ref={ref} role="alert" className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-start">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      <div className="flex flex-wrap gap-2">
        {fixInSettings && (
          <Button size="sm" onClick={openSettings} className="bg-red-700 text-white hover:bg-red-800">
            Open Settings
          </Button>
        )}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="border-red-300 bg-white text-red-800 hover:bg-red-100">
            Try again
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss} className="text-red-800 hover:bg-red-100">
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
