// Pure Idea Workshop draft model — no Firebase imports so it stays unit-testable.
import { EMPTY_IDEA_INPUT, normalizeIdea, type Idea, type IdeaInput, type SkillLevel } from './ideas';
import { DEFAULT_CUSTOMIZATION, type BuildPrompts, type Customization } from './prompts';

export type WorkshopStep = 'describe' | 'choose' | 'customize' | 'prompts';

export interface IdeaDraft {
  step: WorkshopStep;
  input: IdeaInput;
  ideas: Idea[];
  selectedIndex: number | null;
  customization: Customization;
  prompts: BuildPrompts | null;
}

export const EMPTY_DRAFT: IdeaDraft = {
  step: 'describe',
  input: EMPTY_IDEA_INPUT,
  ideas: [],
  selectedIndex: null,
  customization: DEFAULT_CUSTOMIZATION,
  prompts: null,
};

const STEPS: WorkshopStep[] = ['describe', 'choose', 'customize', 'prompts'];
const SKILLS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

/** Validate a stored draft; anything malformed falls back to a safe earlier step. */
export function normalizeDraft(data: Record<string, unknown> | undefined): IdeaDraft {
  if (!data) return EMPTY_DRAFT;
  const rawInput = (data.input ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === 'string' ? v : '');
  const input: IdeaInput = {
    appName: s(rawInput.appName),
    description: s(rawInput.description),
    targetAudience: s(rawInput.targetAudience),
    keyFeatures: s(rawInput.keyFeatures),
    skillLevel: SKILLS.includes(rawInput.skillLevel as SkillLevel) ? (rawInput.skillLevel as SkillLevel) : 'beginner',
  };
  const ideas = Array.isArray(data.ideas) ? data.ideas.map(normalizeIdea).filter((i): i is Idea => i !== null) : [];
  const idx = typeof data.selectedIndex === 'number' && data.selectedIndex >= 0 && data.selectedIndex < ideas.length ? data.selectedIndex : null;
  const rawPrompts = data.prompts as Partial<BuildPrompts> | null | undefined;
  const prompts = rawPrompts && typeof rawPrompts.lovable === 'string' && typeof rawPrompts.cursor === 'string'
    ? { lovable: rawPrompts.lovable, cursor: rawPrompts.cursor }
    : null;
  const customization = { ...DEFAULT_CUSTOMIZATION, ...((data.customization as Partial<Customization>) ?? {}) };

  let step: WorkshopStep = STEPS.includes(data.step as WorkshopStep) ? (data.step as WorkshopStep) : 'describe';
  if (step === 'prompts' && (!prompts || idx === null)) step = 'customize';
  if (step === 'customize' && idx === null) step = 'choose';
  if (step === 'choose' && ideas.length === 0) step = 'describe';

  return { step, input, ideas, selectedIndex: idx, customization, prompts };
}
