import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Eye, EyeOff, Check } from "lucide-react";
import { getSettings, saveSettings, type UserSettings } from "@/lib/settings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [draft, setDraft] = useState<UserSettings>(() => getSettings());
  const [showGemini, setShowGemini] = useState(false);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(getSettings());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    saveSettings({
      geminiApiKey: draft.geminiApiKey.trim(),
      deepseekApiKey: draft.deepseekApiKey.trim(),
    });
    setSaved(true);
    setTimeout(() => onOpenChange(false), 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription>
            CompanAI is bring-your-own-key. Keys are stored only in your browser&apos;s local storage and sent
            directly from your browser to the AI provider — they never touch our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key">Google Gemini API key</Label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                Get a free key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGemini ? "text" : "password"}
                placeholder="AIza..."
                value={draft.geminiApiKey}
                onChange={(e) => setDraft({ ...draft, geminiApiKey: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGemini((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showGemini ? "Hide key" : "Show key"}
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Used for idea generation and (by default) the chat assistant.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deepseek-key">DeepSeek API key (optional)</Label>
              <a
                href="https://platform.deepseek.com/api_keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                Get a key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="deepseek-key"
                type={showDeepseek ? "text" : "password"}
                placeholder="sk-..."
                value={draft.deepseekApiKey}
                onChange={(e) => setDraft({ ...draft, deepseekApiKey: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowDeepseek((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showDeepseek ? "Hide key" : "Show key"}
              >
                {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              When set, the chat assistant uses DeepSeek instead of Gemini. Often cheaper and faster.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
            {saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Saved
              </span>
            ) : (
              "Save keys"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsModal;
