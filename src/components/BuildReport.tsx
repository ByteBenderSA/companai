// The paste-and-diff Build Report card, rendered inside ProjectDetail. The
// student pastes their Lovable or Cursor response here after a build; we grade
// it feature by feature and generate a follow-up prompt for the gaps.

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Circle, History, Loader2, XCircle } from 'lucide-react';
import { AIError } from '@/lib/ai';
import { type BuildReport as BuildReportDoc, type FeatureStatus, type ProjectFeature } from '@/lib/build-report-model';
import { subscribeToProjectBuildReports, submitBuildReport, type SubmittedBuildReport } from '@/lib/build-reports';
import { dataErrorMessage } from '@/lib/data-errors';
import { authErrorMessage } from '@/lib/auth-errors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';
import { ErrorNotice } from './ErrorNotice';
import type { Project } from '@/lib/project-model';

interface BuildReportProps {
  project: Project;
}

const STATUS_META: Record<FeatureStatus, { label: string; Icon: typeof CheckCircle2; iconClass: string; badgeClass: string }> = {
  built: { label: 'Built', Icon: CheckCircle2, iconClass: 'text-green-600', badgeClass: 'border-green-200 bg-green-50 text-green-800' },
  partial: { label: 'Partial', Icon: Loader2, iconClass: 'text-amber-600', badgeClass: 'border-amber-200 bg-amber-50 text-amber-800' },
  missing: { label: 'Missing', Icon: XCircle, iconClass: 'text-red-600', badgeClass: 'border-red-200 bg-red-50 text-red-700' },
  blocked: { label: 'Blocked', Icon: AlertTriangle, iconClass: 'text-orange-600', badgeClass: 'border-orange-200 bg-orange-50 text-orange-800' },
  pending: { label: 'Not reported', Icon: Circle, iconClass: 'text-gray-400', badgeClass: 'border-gray-200 bg-gray-50 text-gray-700' },
};

function FeatureRow({ feature, highlighted }: { feature: ProjectFeature; highlighted?: boolean }) {
  const meta = STATUS_META[feature.status] ?? STATUS_META.pending;
  const { Icon } = meta;
  return (
    <li
      data-testid="build-report-feature"
      data-feature-id={feature.id}
      data-status={feature.status}
      className={cn('flex items-start gap-3 rounded-md border p-3', highlighted ? 'border-purple-300 bg-purple-50/50' : 'border-gray-100')}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', meta.iconClass)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900">{feature.label}</p>
          <Badge variant="outline" className={cn('shrink-0 text-xs', meta.badgeClass)}>
            {meta.label}
          </Badge>
        </div>
        {feature.note ? <p className="mt-1 text-xs text-gray-600">{feature.note}</p> : null}
      </div>
    </li>
  );
}

function ReportHistoryItem({ report }: { report: BuildReportDoc }) {
  const [open, setOpen] = useState(false);
  const counts = useMemo(() => {
    const c: Record<string, number> = { built: 0, partial: 0, missing: 0, blocked: 0 };
    for (const f of report.parsedFeatures) {
      if (f.status in c) c[f.status]++;
    }
    return c;
  }, [report.parsedFeatures]);
  return (
    <div className="rounded-md border">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-gray-50">
        <span className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
          <span className="text-sm text-gray-700">{new Date(report.submittedAt).toLocaleString()}</span>
          <Badge variant="outline" className="text-xs">{report.source}</Badge>
        </span>
        <span className="flex gap-2 text-xs">
          <span className="text-green-700">{counts.built} built</span>
          <span className="text-amber-700">{counts.partial} partial</span>
          <span className="text-red-700">{counts.missing} missing</span>
          {counts.blocked > 0 ? <span className="text-orange-700">{counts.blocked} blocked</span> : null}
        </span>
      </button>
      {open && report.suggestedNextPrompt ? (
        <div className="space-y-2 border-t p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">Follow-up prompt</p>
            <CopyButton text={report.suggestedNextPrompt} size="xs" label="Copy follow-up prompt" />
          </div>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs">{report.suggestedNextPrompt}</pre>
        </div>
      ) : null}
    </div>
  );
}

export function BuildReport({ project }: BuildReportProps) {
  const [paste, setPaste] = useState('');
  const [source, setSource] = useState<'lovable' | 'cursor'>('lovable');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [latest, setLatest] = useState<SubmittedBuildReport | null>(null);
  const [history, setHistory] = useState<BuildReportDoc[]>([]);

  useEffect(() => {
    const unsub = subscribeToProjectBuildReports(
      project.id,
      setHistory,
      (err) => setError(new Error(dataErrorMessage(err)))
    );
    return unsub;
  }, [project.id]);

  async function handleSubmit() {
    if (!paste.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitBuildReport({ project, rawPaste: paste.trim(), source });
      setLatest(result);
      setPaste('');
      toast({
        title: 'Build report analysed',
        description: `${result.completionPct}% complete — ${result.parsedFeatures.length} features graded.`,
      });
    } catch (err) {
      const message = err instanceof AIError ? authErrorMessage(err) : dataErrorMessage(err);
      setError(new Error(message));
    } finally {
      setBusy(false);
    }
  }

  const highlightIds = useMemo(
    () => (latest ? new Set(latest.parsedFeatures.map((f) => f.id)) : undefined),
    [latest]
  );
  const completionPct = latest?.completionPct ?? project.completionPct ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-xl">Build report</CardTitle>
          <p className="mt-1 text-sm text-gray-600">
            After Lovable or Cursor finishes a build, paste the full response here. We check it against your feature list and
            generate a follow-up prompt for anything missing.
          </p>
        </div>
        <div className="text-right">
          <div data-testid="build-report-completion" className="text-3xl font-bold text-gray-900">{completionPct}%</div>
          <div className="text-xs text-gray-600">complete</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          data-testid="build-report-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-700">Source:</span>
            <Button type="button" size="sm" variant={source === 'lovable' ? 'default' : 'outline'} onClick={() => setSource('lovable')}>
              Lovable
            </Button>
            <Button type="button" size="sm" variant={source === 'cursor' ? 'default' : 'outline'} onClick={() => setSource('cursor')}>
              Cursor
            </Button>
          </div>
          <Textarea
            aria-label="Paste the builder's response"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={`Paste the complete response from ${source}. We look for the companai-report-v1 JSON block first; if it's not there, your Gemini key extracts the status.`}
            rows={6}
            disabled={busy}
            className="font-mono text-xs"
            data-testid="build-report-paste"
          />
          {error ? <ErrorNotice error={error} /> : null}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{paste.length > 0 ? `${paste.length.toLocaleString()} characters` : ' '}</p>
            <Button type="submit" disabled={busy || !paste.trim()} data-testid="build-report-submit">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing…</> : 'Analyse build'}
            </Button>
          </div>
        </form>

        {/* Feature status list — always shown so students can see their project's current state */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Feature status</h3>
            {latest ? (
              <Badge variant="outline" className="text-xs">
                Source: {latest.extractionSource === 'fence' ? 'JSON block' : 'AI extracted'}
              </Badge>
            ) : null}
          </div>
          {project.features.length === 0 ? (
            <p className="text-sm text-gray-600">This project has no features saved yet.</p>
          ) : (
            <ul className="space-y-2">
              {project.features.map((f) => (
                <FeatureRow key={f.id} feature={f} highlighted={highlightIds?.has(f.id)} />
              ))}
            </ul>
          )}
        </div>

        {latest?.suggestedNextPrompt ? (
          <div data-testid="build-report-next-prompt" className="overflow-hidden rounded-lg border-2 border-purple-200">
            <div className="flex items-center justify-between gap-3 bg-purple-50 px-4 py-3">
              <div>
                <h3 className="font-semibold text-purple-900">Fix the gaps</h3>
                <p className="text-xs text-purple-700">Copy this prompt into Lovable to finish what's missing.</p>
              </div>
              <CopyButton text={latest.suggestedNextPrompt} variant="primary" label="Copy prompt" />
            </div>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap bg-gray-50 p-4 text-xs">{latest.suggestedNextPrompt}</pre>
          </div>
        ) : null}

        {latest && latest.blockers.length > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-semibold text-amber-900">Blockers from the last build</h3>
            </div>
            <ul className="ml-5 list-disc space-y-1 text-sm text-amber-900">
              {latest.blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Previous reports</h3>
              <Badge variant="outline" className="text-xs">{history.length}</Badge>
            </div>
            <div className="space-y-2">
              {history.map((r) => (
                <ReportHistoryItem key={r.id} report={r} />
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
