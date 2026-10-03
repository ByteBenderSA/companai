// Pure helpers for the Idea Workshop: what we ask the AI for, and how we read its answer.
// No Firebase or network imports here so it stays unit-testable.

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface IdeaInput {
  appName: string;
  description: string;
  targetAudience: string;
  keyFeatures: string;
  skillLevel: SkillLevel;
}

export interface Idea {
  title: string;
  description: string;
  features: string[];
  techStack: string[];
  difficulty: Difficulty;
  timeEstimate: string;
  learningObjectives: string[];
}

export const EMPTY_IDEA_INPUT: IdeaInput = {
  appName: '',
  description: '',
  targetAudience: '',
  keyFeatures: '',
  skillLevel: 'beginner',
};

export const IDEA_COUNT = 3;

/** JSON Schema sent to Gemini so it answers with exactly this shape. */
export const IDEAS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      minItems: IDEA_COUNT,
      maxItems: IDEA_COUNT,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short, specific product name' },
          description: { type: 'string', description: '2-3 sentences: who it is for and what problem it solves' },
          features: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 8 },
          techStack: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 6 },
          difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
          timeEstimate: { type: 'string', description: 'e.g. "1-2 weeks"' },
          learningObjectives: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
        },
        required: ['title', 'description', 'features', 'techStack', 'difficulty', 'timeEstimate', 'learningObjectives'],
      },
    },
  },
  required: ['ideas'],
} as const;

const LIMITS = {
  title: 80,
  description: 600,
  item: 160,
  timeEstimate: 40,
};

export function buildIdeasPrompt(input: IdeaInput): string {
  const line = (label: string, value: string) => `${label}: ${value.trim() || '(not specified)'}`;
  return [
    `You help people turn a rough app idea into ${IDEA_COUNT} concrete, buildable project variations.`,
    'Stay close to what the person described — do not drift into a generic app. Make the three variations meaningfully different',
    '(for example: a minimal version, a version focused on a specific audience, and a more ambitious version).',
    'Features must be concrete user-facing capabilities, each a short phrase (no trailing explanations).',
    'Prefer a stack that works well with Lovable (React, TypeScript, Tailwind CSS) and Firebase or Supabase for the backend.',
    `Match difficulty and scope to the person's experience level (${input.skillLevel}).`,
    '',
    'The idea:',
    line('App name', input.appName),
    line('Description', input.description),
    line('Target audience', input.targetAudience),
    line('Key features they want', input.keyFeatures),
  ].join('\n');
}

function clip(value: string, max: number): string {
  const v = value.trim().replace(/\s+/g, ' ');
  return v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v;
}

function asString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = clip(value, max);
  return v.length > 0 ? v : null;
}

function asStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    const s = asString(item, LIMITS.item);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function asDifficulty(value: unknown): Difficulty {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v.startsWith('adv')) return 'Advanced';
    if (v.startsWith('int')) return 'Intermediate';
  }
  return 'Beginner';
}

/** Validate one idea object from the model. Returns null if it is unusable. */
export function normalizeIdea(raw: unknown): Idea | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title, LIMITS.title);
  const description = asString(r.description, LIMITS.description);
  const features = asStringList(r.features, 8);
  if (!title || !description || features.length === 0) return null;
  return {
    title,
    description,
    features,
    techStack: asStringList(r.techStack, 6),
    difficulty: asDifficulty(r.difficulty),
    timeEstimate: asString(r.timeEstimate, LIMITS.timeEstimate) ?? '1-2 weeks',
    learningObjectives: asStringList(r.learningObjectives, 5),
  };
}

/** Pull the first JSON value out of text that may be wrapped in ```json fences or prose. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }
  const start = trimmed.search(/[[{]/);
  if (start >= 0) {
    const open = trimmed[start];
    const close = open === '{' ? '}' : ']';
    const end = trimmed.lastIndexOf(close);
    if (end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
  }
  return undefined;
}

/**
 * Parse the model's answer into ideas. Accepts `{ideas: [...]}`, a bare array,
 * or a single object. Throws if nothing usable came back.
 */
export function parseIdeas(text: string): Idea[] {
  const json = extractJson(text);
  let list: unknown[] = [];
  if (Array.isArray(json)) list = json;
  else if (json && typeof json === 'object') {
    const ideas = (json as { ideas?: unknown }).ideas;
    list = Array.isArray(ideas) ? ideas : [json];
  }
  const ideas = list.map(normalizeIdea).filter((i): i is Idea => i !== null).slice(0, IDEA_COUNT);
  if (ideas.length === 0) {
    throw new Error('The AI response did not contain any usable ideas.');
  }
  return ideas;
}

export function isIdeaInputReady(input: IdeaInput): boolean {
  return input.appName.trim().length > 0 && input.description.trim().length > 0;
}
