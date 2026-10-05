import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TIPS = [
  'Good apps solve one problem really well. You can always add features later.',
  'When you paste a prompt into Lovable, check the preview after every change.',
  'Commit to GitHub often — it is your undo button.',
  'Stuck on an error? Paste the exact message into the mentor chat.',
];

/**
 * Shown while the AI works (15–40 s). Status lines rotate on a timer — they describe what the model
 * is doing in general, not real progress, so there is no fake percentage.
 */
export function GeneratingPanel({ title, stages, estimate }: { title: string; stages: string[]; estimate: string }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const stage = stages[Math.min(Math.floor(seconds / 6), stages.length - 1)];
  const tip = TIPS[Math.floor(seconds / 8) % TIPS.length];

  return (
    <Card className="mx-auto max-w-xl overflow-hidden" role="status" aria-live="polite" data-testid="generating">
      <div className="h-1 w-full overflow-hidden bg-purple-100">
        <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-purple-600" />
      </div>
      <CardContent className="space-y-5 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
          <Sparkles className="h-7 w-7 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> {stage}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {seconds}s · usually {estimate}. You can leave this tab open — your work is saved.
        </p>
        <div className="rounded-lg bg-blue-50 p-3 text-left text-sm text-blue-900">
          <span className="font-semibold">Tip: </span>
          {tip}
        </div>
      </CardContent>
    </Card>
  );
}
