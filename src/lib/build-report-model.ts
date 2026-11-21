// Build-report model: structured per-feature status and the paste-and-diff
// Build Report document. Kept Firebase-free so it stays unit-testable (see
// CONTRIBUTING.md). Firestore CRUD lives in src/lib/build-reports.ts (next PR).
//
// The "build report" feature lets a student paste the full Lovable or Cursor
// response back into CompanAI after a build. Lovable is asked (via a prompt
// appendix added in the next PR) to emit a fenced JSON block tagged
// `companai-report-v1`, with the project's own feature ids baked in. Parsing
// is then a plain JSON.parse — no fuzzy string matching. When a paste has no
// fence we fall back to a Gemini call client-side with the student's own key.

export type FeatureStatus =
  | 'pending'
  | 'built'
  | 'partial'
  | 'missing'
  | 'blocked';

export const FEATURE_STATUSES: readonly FeatureStatus[] = [
  'pending',
  'built',
  'partial',
  'missing',
  'blocked',
];

export interface ProjectFeature {
  /** Stable id, e.g. 'f1'. References from a BuildReport use this id. */
  id: string;
  label: string;
  status: FeatureStatus;
  /** ISO timestamp of the most recent BuildReport that set this status. */
  lastUpdatedFromReport?: string;
  /** Optional AI comment on partial/blocked status. */
  note?: string;
}

/** The fence token Lovable/Cursor emit around the JSON report. Versioned. */
export const BUILD_REPORT_FENCE = 'companai-report-v1';

export interface BuildReport {
  id: string;
  projectId: string;
  ownerId: string;
  /** ISO timestamp. Server timestamp on write, normalized to string on read. */
  submittedAt: string;
  source: 'lovable' | 'cursor' | 'other';
  /** 'fence' = clean JSON extraction; 'gemini' = AI had to interpret. */
  extractionSource: 'fence' | 'gemini';
  /** The student's original paste, kept for audit. */
  rawPaste: string;
  parsedFeatures: Array<{ id: string; status: FeatureStatus; note?: string }>;
  blockers: string[];
  filesChanged: string[];
  /** Deterministic follow-up prompt targeting only the gaps. Built client-side. */
  suggestedNextPrompt?: string;
}

const isFeatureStatus = (v: unknown): v is FeatureStatus =>
  typeof v === 'string' && (FEATURE_STATUSES as readonly string[]).includes(v);

/**
 * Accept either the current `ProjectFeature[]` shape or the legacy `string[]`
 * shape (and anything in between) and return canonical `ProjectFeature[]`. Ids
 * are assigned from the entry's index when missing; unknown statuses collapse
 * to 'pending'. Junk entries (null, numbers) are dropped.
 */
export function normalizeFeatures(raw: unknown): ProjectFeature[] {
  if (!Array.isArray(raw)) return [];
  const out: ProjectFeature[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    if (typeof entry === 'string') {
      if (entry.trim()) out.push({ id: `f${out.length + 1}`, label: entry, status: 'pending' });
      continue;
    }
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      const label = typeof e.label === 'string' ? e.label : '';
      if (!label.trim()) continue;
      const id = typeof e.id === 'string' && e.id ? e.id : `f${out.length + 1}`;
      const status = isFeatureStatus(e.status) ? e.status : 'pending';
      const lastUpdatedFromReport =
        typeof e.lastUpdatedFromReport === 'string' ? e.lastUpdatedFromReport : undefined;
      const note = typeof e.note === 'string' ? e.note : undefined;
      out.push({ id, label, status, ...(lastUpdatedFromReport ? { lastUpdatedFromReport } : {}), ...(note ? { note } : {}) });
    }
  }
  return out;
}

/** Convert an idea's `string[]` features into structured `ProjectFeature[]`. */
export function toProjectFeatures(labels: readonly string[]): ProjectFeature[] {
  return labels
    .filter((l) => typeof l === 'string' && l.trim().length > 0)
    .map((label, i) => ({ id: `f${i + 1}`, label, status: 'pending' as FeatureStatus }));
}

/** Extract just the labels — useful when building prompts or chat context. */
export function featureLabels(features: readonly ProjectFeature[] | readonly string[] | undefined): string[] {
  if (!features) return [];
  return (features as readonly (ProjectFeature | string)[]).map((f) =>
    typeof f === 'string' ? f : f.label
  );
}

/**
 * Completion percentage from feature statuses, rounded. `partial` counts as
 * half a feature. Returns 0 when the feature list is empty, so an unsaved
 * project reads as 0 rather than NaN.
 */
export function computeCompletionPct(features: readonly ProjectFeature[]): number {
  if (features.length === 0) return 0;
  const score = features.reduce((sum, f) => {
    if (f.status === 'built') return sum + 1;
    if (f.status === 'partial') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / features.length) * 100);
}
