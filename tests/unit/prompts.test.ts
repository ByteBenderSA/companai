import { describe, expect, it } from 'vitest';
import { buildPromptsRequest, DEFAULT_CUSTOMIZATION, describeColors, parseBuildPrompts, templatePrompts } from '@/lib/prompts';
import type { Idea } from '@/lib/ideas';

const idea: Idea = {
  title: 'StudyBuddy',
  description: 'Match students for study sessions.',
  features: ['Course matching', 'Chat'],
  techStack: ['React', 'Firebase'],
  difficulty: 'Beginner',
  timeEstimate: '2 weeks',
  learningObjectives: [],
};

describe('parseBuildPrompts', () => {
  it('returns both prompts, trimmed', () => {
    expect(parseBuildPrompts({ lovablePrompt: ' UI \n', cursorPrompt: 'Backend' })).toEqual({ lovable: 'UI', cursor: 'Backend' });
  });

  it('keeps "---" and headings inside a prompt intact (the old splitter cut on these)', () => {
    const lovable = '# Screens\n\n---\n\n## CURSOR PROMPT is mentioned here';
    expect(parseBuildPrompts({ lovablePrompt: lovable, cursorPrompt: 'c' }).lovable).toBe(lovable);
  });

  it('throws if either prompt is missing', () => {
    expect(() => parseBuildPrompts({ lovablePrompt: 'only one' })).toThrow();
    expect(() => parseBuildPrompts(undefined)).toThrow();
  });
});

describe('buildPromptsRequest', () => {
  it('includes the idea, extra features and customisation', () => {
    const text = buildPromptsRequest(idea, {
      ...DEFAULT_CUSTOMIZATION,
      layoutStyle: 'mobile-first',
      extraFeatures: ['Dark mode'],
      userFlow: 'Sign up → match → chat',
    });
    expect(text).toContain('App title (use exactly): StudyBuddy');
    expect(text).toContain('Course matching; Chat; Dark mode');
    expect(text).toContain('Mobile-first');
    expect(text).toContain('Main user journey: Sign up → match → chat');
  });
});

describe('describeColors', () => {
  it('normalises a custom hex colour', () => {
    expect(describeColors({ colorScheme: 'custom', customHexColor: 'ff0066' })).toContain('#ff0066');
  });
  it('falls back gracefully for an invalid custom colour', () => {
    expect(describeColors({ colorScheme: 'custom', customHexColor: 'red' })).toBe('a tasteful custom colour palette');
  });
});

describe('templatePrompts', () => {
  it('produces both prompts mentioning every feature', () => {
    const p = templatePrompts(idea);
    for (const f of idea.features) {
      expect(p.lovable).toContain(f);
      expect(p.cursor).toContain(f);
    }
  });
});
