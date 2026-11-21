// Pure project model: shape, legacy-document normalisation and derived status.
// No Firebase imports so it stays unit-testable.
import {
  computeCompletionPct,
  featureLabels,
  normalizeFeatures,
  toProjectFeatures,
  type ProjectFeature,
} from './build-report-model';
import type { Difficulty, Idea } from './ideas';
import type { BuildPrompts, Customization } from './prompts';

export const BUILD_STEP_IDS = ['lovable', 'github', 'cursor', 'deploy'] as const;
export type BuildStepId = (typeof BUILD_STEP_IDS)[number];

export type ProjectStatus = 'planning' | 'building' | 'completed';

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  /**
   * Structured features with per-feature build status. Legacy documents store
   * `features: string[]`; `normalizeProject` promotes them to this shape on
   * read, so no migration script is needed.
   */
  features: ProjectFeature[];
  techStack: string[];
  difficulty: Difficulty;
  timeEstimate: string;
  learningObjectives: string[];
  prompts: Partial<BuildPrompts>;
  /** 'ai' = generated with the student's customisations; 'template' = quick-save starter prompts. */
  promptsSource: 'ai' | 'template';
  customization?: Customization;
  completedSteps: BuildStepId[];
  /** Percent of features marked `built` or `partial` (rounded). Set by the build-report flow. */
  completionPct?: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Firestore Timestamp | ISO string | millis | Date → Date (or null). */
export function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

const LEGACY_STEP_NUMBERS: Record<number, BuildStepId> = { 1: 'lovable', 2: 'github', 3: 'cursor', 4: 'deploy' };

function readSteps(data: Record<string, unknown>): BuildStepId[] {
  const out = new Set<BuildStepId>();
  for (const s of strings(data.completedSteps)) {
    if ((BUILD_STEP_IDS as readonly string[]).includes(s)) out.add(s as BuildStepId);
  }
  // Older documents stored progress.completedSteps as step numbers 1-4.
  const progress = data.progress as { completedSteps?: unknown } | undefined;
  if (progress && Array.isArray(progress.completedSteps)) {
    for (const n of progress.completedSteps) {
      if (typeof n === 'number' && LEGACY_STEP_NUMBERS[n]) out.add(LEGACY_STEP_NUMBERS[n]);
    }
  }
  return BUILD_STEP_IDS.filter((id) => out.has(id));
}

function readPrompts(data: Record<string, unknown>): Partial<BuildPrompts> {
  const p = (data.prompts ?? {}) as Record<string, unknown>;
  const g = (data.generatedPrompts ?? {}) as Record<string, unknown>;
  const lovable = str(p.lovable) || str(g.lovablePrompt);
  const cursor = str(p.cursor) || str(g.cursorPrompt);
  return { ...(lovable ? { lovable } : {}), ...(cursor ? { cursor } : {}) };
}

function readDifficulty(v: unknown): Difficulty {
  return v === 'Intermediate' || v === 'Advanced' ? v : 'Beginner';
}

/** Turn a Firestore document (current or legacy shape) into a Project. */
export function normalizeProject(id: string, data: Record<string, unknown>): Project {
  const features = normalizeFeatures(data.features);
  const storedPct = typeof data.completionPct === 'number' ? Math.round(data.completionPct) : undefined;
  return {
    id,
    ownerId: str(data.ownerId),
    title: str(data.title, 'Untitled project'),
    description: str(data.description),
    features,
    techStack: strings(data.techStack),
    difficulty: readDifficulty(data.difficulty),
    timeEstimate: str(data.timeEstimate),
    learningObjectives: strings(data.learningObjectives),
    prompts: readPrompts(data),
    promptsSource: data.promptsSource === 'template' ? 'template' : 'ai',
    customization: (data.customization as Customization | undefined) ?? undefined,
    completedSteps: readSteps(data),
    // Prefer the stored percent; if absent (legacy or pre-report project), derive from statuses.
    completionPct: storedPct ?? (features.some((f) => f.status !== 'pending') ? computeCompletionPct(features) : undefined),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function projectStatus(completedSteps: readonly BuildStepId[]): ProjectStatus {
  if (completedSteps.length === 0) return 'planning';
  if (BUILD_STEP_IDS.every((id) => completedSteps.includes(id))) return 'completed';
  return 'building';
}

export function toggleStep(completed: readonly BuildStepId[], step: BuildStepId, done: boolean): BuildStepId[] {
  const set = new Set(completed);
  if (done) set.add(step);
  else set.delete(step);
  return BUILD_STEP_IDS.filter((id) => set.has(id));
}

/** Fields written when an idea is saved as a new project. */
export function newProjectFields(ownerId: string, idea: Idea, prompts: BuildPrompts, source: 'ai' | 'template', customization?: Customization) {
  return {
    ownerId,
    title: idea.title,
    description: idea.description,
    features: toProjectFeatures(idea.features),
    techStack: idea.techStack,
    difficulty: idea.difficulty,
    timeEstimate: idea.timeEstimate,
    learningObjectives: idea.learningObjectives,
    prompts,
    promptsSource: source,
    ...(customization ? { customization } : {}),
    completedSteps: [] as BuildStepId[],
    status: 'planning' as ProjectStatus,
  };
}

export function ideaFromProject(p: Project): Idea {
  return {
    title: p.title,
    description: p.description,
    features: featureLabels(p.features),
    techStack: p.techStack,
    difficulty: p.difficulty,
    timeEstimate: p.timeEstimate,
    learningObjectives: p.learningObjectives,
  };
}

export function timeAgo(date: Date | null, now: Date = new Date()): string {
  if (!date) return '';
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}
