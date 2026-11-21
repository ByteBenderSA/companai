// Firestore CRUD for the build-report sub-collection and the orchestrator the
// UI calls when the student clicks "Analyse build". Pure parsing + Gemini
// fallback live in build-report-parse.ts and ai/build-report.ts.

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { extractBuildReportViaGemini } from './ai/build-report';
import {
  computeCompletionPct,
  type BuildReport,
  type FeatureStatus,
  type ProjectFeature,
} from './build-report-model';
import { buildGapPrompt, extractFromFence, type ParsedReport } from './build-report-parse';
import { db } from './firebase';
import { toDate } from './project-model';
import type { Project } from './project-model';

const reportsCol = (projectId: string) => collection(db, 'projects', projectId, 'buildReports');

export interface SubmitBuildReportInput {
  project: Project;
  rawPaste: string;
  source: 'lovable' | 'cursor';
}

export interface SubmittedBuildReport {
  reportId: string;
  extractionSource: 'fence' | 'gemini';
  completionPct: number;
  updatedFeatures: ProjectFeature[];
  parsedFeatures: ParsedReport['features'];
  blockers: string[];
  filesChanged: string[];
  suggestedNextPrompt: string | null;
}

function mergeFeatureStatuses(
  features: readonly ProjectFeature[],
  parsed: ParsedReport,
  now: string
): ProjectFeature[] {
  const byId = new Map(parsed.features.map((p) => [p.id, p]));
  return features.map((f) => {
    const update = byId.get(f.id);
    if (!update) return f;
    return {
      ...f,
      status: update.status as FeatureStatus,
      ...(update.note ? { note: update.note } : {}),
      lastUpdatedFromReport: now,
    };
  });
}

/**
 * The single entry point the UI calls. Order:
 *   1. Try strict fence extraction (free, instant).
 *   2. Fall back to Gemini extraction using the student's own key.
 *   3. Merge statuses into the project, compute completionPct, build the
 *      follow-up prompt for the gaps.
 *   4. Write the BuildReport doc AND the project update in one Firestore
 *      batch, so the project never shows new feature statuses without a report
 *      row behind them.
 *
 * Throws on:
 *   - project has no features (nothing to report against)
 *   - Gemini errors (missing-key, rate-limit, …) when the fence was missing
 *   - Firestore errors (rules, offline)
 *
 * Does NOT swallow the paste — it's written to the BuildReport doc exactly as
 * provided so the student can audit later.
 */
export async function submitBuildReport({ project, rawPaste, source }: SubmitBuildReportInput): Promise<SubmittedBuildReport> {
  if (project.features.length === 0) {
    throw new Error('This project has no features yet, so there is nothing to report against.');
  }
  const knownIds = new Set(project.features.map((f) => f.id));

  const strict = extractFromFence(rawPaste, knownIds);
  let parsed: ParsedReport;
  let extractionSource: 'fence' | 'gemini';
  if (strict && strict.features.length > 0) {
    parsed = strict;
    extractionSource = 'fence';
  } else {
    parsed = await extractBuildReportViaGemini(rawPaste, project.features);
    extractionSource = 'gemini';
  }

  const now = new Date().toISOString();
  const updatedFeatures = mergeFeatureStatuses(project.features, parsed, now);
  const completionPct = computeCompletionPct(updatedFeatures);
  const suggestedNextPrompt = buildGapPrompt(project, parsed);

  const projectRef = doc(db, 'projects', project.id);
  const reportRef = doc(reportsCol(project.id));
  const batch = writeBatch(db);
  batch.set(reportRef, {
    ownerId: project.ownerId,
    projectId: project.id,
    source,
    extractionSource,
    rawPaste,
    parsedFeatures: parsed.features,
    blockers: parsed.blockers,
    filesChanged: parsed.filesChanged,
    suggestedNextPrompt: suggestedNextPrompt ?? '',
    submittedAt: serverTimestamp(),
  });
  batch.update(projectRef, {
    features: updatedFeatures,
    completionPct,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();

  return {
    reportId: reportRef.id,
    extractionSource,
    completionPct,
    updatedFeatures,
    parsedFeatures: parsed.features,
    blockers: parsed.blockers,
    filesChanged: parsed.filesChanged,
    suggestedNextPrompt: suggestedNextPrompt ?? null,
  };
}

function hydrateBuildReport(id: string, projectId: string, data: Record<string, unknown>): BuildReport {
  const submittedAt = toDate(data.submittedAt)?.toISOString() ?? new Date().toISOString();
  const source = data.source === 'lovable' || data.source === 'cursor' ? data.source : 'other';
  const extractionSource = data.extractionSource === 'fence' ? 'fence' : 'gemini';
  return {
    id,
    projectId,
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
    submittedAt,
    source,
    extractionSource,
    rawPaste: typeof data.rawPaste === 'string' ? data.rawPaste : '',
    parsedFeatures: Array.isArray(data.parsedFeatures)
      ? (data.parsedFeatures as BuildReport['parsedFeatures'])
      : [],
    blockers: Array.isArray(data.blockers) ? (data.blockers as string[]) : [],
    filesChanged: Array.isArray(data.filesChanged) ? (data.filesChanged as string[]) : [],
    suggestedNextPrompt:
      typeof data.suggestedNextPrompt === 'string' && data.suggestedNextPrompt
        ? data.suggestedNextPrompt
        : undefined,
  };
}

/** Live list of a project's build reports, newest first. Returns an unsubscribe function. */
export function subscribeToProjectBuildReports(
  projectId: string,
  onData: (reports: BuildReport[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(reportsCol(projectId), orderBy('submittedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => hydrateBuildReport(d.id, projectId, d.data()))),
    (err) => {
      if ((err as { code?: string }).code === 'permission-denied') onData([]);
      else onError(err);
    }
  );
}
