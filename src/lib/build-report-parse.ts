// Pure extraction + validation for a pasted Lovable/Cursor build response.
// No Firebase or network imports; the Gemini-fallback caller lives in
// build-reports.ts. See prompt-appendix.ts for the matching emitter.

import {
  BUILD_REPORT_FENCE,
  FEATURE_STATUSES,
  type FeatureStatus,
  type ProjectFeature,
} from './build-report-model';

export interface ParsedReport {
  projectId?: string;
  features: Array<{ id: string; status: FeatureStatus; note?: string }>;
  blockers: string[];
  filesChanged: string[];
}

const REPORT_FENCE_RE = new RegExp(`\`\`\`${BUILD_REPORT_FENCE}\\s*([\\s\\S]*?)\`\`\``);

const isFeatureStatus = (v: unknown): v is FeatureStatus =>
  typeof v === 'string' && (FEATURE_STATUSES as readonly string[]).includes(v);

const trimmed = (v: unknown, max = 500): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

/**
 * Validate the raw JSON shape against the known feature ids. Unknown ids,
 * invalid statuses and junk entries are dropped silently — a hallucinating
 * model can't invent features that aren't on the project. Caps applied:
 * features <= 30, blockers <= 20, filesChanged <= 100.
 */
export function validateParsedReport(raw: unknown, knownFeatureIds: ReadonlySet<string>): ParsedReport {
  const out: ParsedReport = { features: [], blockers: [], filesChanged: [] };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;

  if (typeof r.projectId === 'string') out.projectId = r.projectId;

  if (Array.isArray(r.features)) {
    const seen = new Set<string>();
    for (const entry of r.features) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const id = typeof e.id === 'string' ? e.id : '';
      if (!id || !knownFeatureIds.has(id) || seen.has(id)) continue;
      if (!isFeatureStatus(e.status)) continue;
      seen.add(id);
      const note = trimmed(e.note);
      out.features.push({ id, status: e.status, ...(note ? { note } : {}) });
      if (out.features.length >= 30) break;
    }
  }

  if (Array.isArray(r.blockers)) {
    for (const b of r.blockers) {
      const t = trimmed(b);
      if (t) out.blockers.push(t);
      if (out.blockers.length >= 20) break;
    }
  }

  if (Array.isArray(r.filesChanged)) {
    for (const f of r.filesChanged) {
      const t = trimmed(f, 300);
      if (t) out.filesChanged.push(t);
      if (out.filesChanged.length >= 100) break;
    }
  }

  return out;
}

/**
 * Strict path: look for the `companai-report-v1` fence in the paste, JSON.parse
 * the inner content, run it through the validator. Returns null when there's
 * no fence or the content isn't JSON. Null tells the caller to fall back to
 * Gemini extraction.
 */
export function extractFromFence(rawPaste: string, knownFeatureIds: ReadonlySet<string>): ParsedReport | null {
  const match = rawPaste.match(REPORT_FENCE_RE);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    return validateParsedReport(parsed, knownFeatureIds);
  } catch {
    return null;
  }
}

/**
 * Deterministic follow-up prompt targeting only the features the latest report
 * didn't complete. No LLM call — every character here is intentional. Returns
 * undefined when nothing is missing, so the UI can decide not to render it.
 */
export function buildGapPrompt(
  project: { title: string; features: readonly ProjectFeature[] },
  report: ParsedReport
): string | undefined {
  const statusById = new Map(report.features.map((f) => [f.id, f.status] as const));
  // Anything not confirmed `built` counts as a gap. If the report didn't mention
  // a feature (misbehaving model), its project status falls through; a pending
  // feature then shows up as "add", so the student still sees unfinished work.
  const gaps = project.features.filter((f) => {
    const s = statusById.get(f.id) ?? f.status;
    return s !== 'built';
  });
  if (gaps.length === 0) return undefined;

  const bullets = gaps
    .map((f) => {
      const s = statusById.get(f.id);
      const noteFromReport = report.features.find((r) => r.id === f.id)?.note;
      const verb = s === 'partial' ? 'finish' : s === 'blocked' ? 'unblock' : 'add';
      const note = noteFromReport ? ` — last build: ${noteFromReport}` : '';
      return `- **${verb}** [${f.id}] ${f.label}${note}`;
    })
    .join('\n');

  const blockerLines =
    report.blockers.length > 0
      ? `\n\n**Known blockers from the last build:**\n${report.blockers.map((b) => `- ${b}`).join('\n')}`
      : '';

  return `# Follow-up build prompt — ${project.title}

Your previous build was incomplete. Focus only on the items below. Do not refactor or rebuild features that already work.

## Items to complete

${bullets}${blockerLines}

## Rules

- Keep every working feature intact.
- Match the existing design and code style of the project.
- After you finish, append a completion report in the same \`${BUILD_REPORT_FENCE}\` fenced JSON block I asked for last time, with the same feature ids.
`;
}
