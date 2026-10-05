import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DEFAULT_GEMINI_MODEL, getSettings, saveSettings, type UserSettings } from '@/lib/settings';
import { AIError } from '@/lib/ai/errors';
import { toast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TestState = { status: 'idle' } | { status: 'testing' } | { status: 'ok' } | { status: 'error'; message: string };

function SecretInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 font-mono"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
        aria-label={visible ? 'Hide key' : 'Show key'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [draft, setDraft] = useState<UserSettings>(() => getSettings());
  const [test, setTest] = useState<TestState>({ status: 'idle' });

  useEffect(() => {
    if (open) {
      setDraft(getSettings());
      setTest({ status: 'idle' });
    }
  }, [open]);

  const clean = (): UserSettings => ({
    geminiApiKey: draft.geminiApiKey.trim(),
    deepseekApiKey: draft.deepseekApiKey.trim(),
    geminiModel: draft.geminiModel.trim(),
  });

  const handleSave = () => {
    saveSettings(clean());
    toast({ title: 'Settings saved', description: 'Your keys are stored in this browser only.' });
    onOpenChange(false);
  };

  const handleTest = async () => {
    saveSettings(clean());
    setTest({ status: 'testing' });
    try {
      // Loaded on demand so the Gemini SDK is not part of the first page load.
      const { testGeminiKey } = await import('@/lib/ai/gemini');
      await testGeminiKey();
      setTest({ status: 'ok' });
    } catch (err) {
      setTest({ status: 'error', message: err instanceof AIError ? err.message : 'The test request failed.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings — AI keys</DialogTitle>
          <DialogDescription>
            CompanAI uses your own free Gemini key. Keys are saved only in this browser and sent straight to the AI
            provider — never to CompanAI or your instructor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="gemini-key">Google Gemini API key</Label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
              >
                Get a free key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <SecretInput
              id="gemini-key"
              placeholder="AIza…"
              value={draft.geminiApiKey}
              onChange={(v) => {
                setDraft({ ...draft, geminiApiKey: v });
                setTest({ status: 'idle' });
              }}
            />
            <p className="text-xs text-gray-500">
              Create one at Google AI Studio → <span className="font-medium">Get API key</span> → <span className="font-medium">Create API key</span>, then paste it here.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={!draft.geminiApiKey.trim() || test.status === 'testing'}>
                {test.status === 'testing' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Test key
              </Button>
              {test.status === 'ok' && (
                <span className="flex items-center gap-1 text-sm text-green-700" role="status">
                  <CheckCircle2 className="h-4 w-4" /> Key works
                </span>
              )}
              {test.status === 'error' && (
                <span className="flex items-start gap-1 text-sm text-red-700" role="alert">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {test.message}
                </span>
              )}
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="text-sm font-medium text-gray-700 hover:text-gray-900">Advanced options ▾</CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Gemini model</Label>
                <Input
                  id="gemini-model"
                  placeholder={DEFAULT_GEMINI_MODEL}
                  value={draft.geminiModel}
                  onChange={(e) => setDraft({ ...draft, geminiModel: e.target.value })}
                  className="font-mono"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to use <code>{DEFAULT_GEMINI_MODEL}</code>. Change it only if Google retires that model or your instructor
                  asks you to.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="deepseek-key">DeepSeek API key (optional)</Label>
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
                  >
                    Get a key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <SecretInput
                  id="deepseek-key"
                  placeholder="sk-…"
                  value={draft.deepseekApiKey}
                  onChange={(v) => setDraft({ ...draft, deepseekApiKey: v })}
                />
                <p className="text-xs text-gray-500">If set, the chat mentor uses DeepSeek (a paid service) instead of Gemini.</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 text-white hover:bg-purple-700">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
