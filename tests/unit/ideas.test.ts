import { describe, expect, it } from 'vitest';
import { buildIdeasPrompt, EMPTY_IDEA_INPUT, extractJson, isIdeaInputReady, normalizeIdea, parseIdeas } from '@/lib/ideas';

const idea = (title: string) => ({
  title,
  description: `${title} helps people do a thing.`,
  features: ['Sign up', 'Create items', 'Share items', 'Search'],
  techStack: ['React', 'TypeScript', 'Firebase'],
  difficulty: 'Intermediate',
  timeEstimate: '2 weeks',
  learningObjectives: ['Auth', 'CRUD'],
});

describe('parseIdeas', () => {
  it('reads the structured {ideas: [...]} answer', () => {
    const ideas = parseIdeas(JSON.stringify({ ideas: [idea('A'), idea('B'), idea('C')] }));
    expect(ideas.map((i) => i.title)).toEqual(['A', 'B', 'C']);
    expect(ideas[0].difficulty).toBe('Intermediate');
  });

  it('accepts a bare array and fenced JSON with surrounding prose', () => {
    const text = 'Here you go!\n```json\n' + JSON.stringify([idea('X'), idea('Y')]) + '\n```\nEnjoy.';
    expect(parseIdeas(text).map((i) => i.title)).toEqual(['X', 'Y']);
  });

  it('keeps at most three ideas and drops unusable ones', () => {
    const list = [idea('1'), { title: 'no description' }, idea('2'), idea('3'), idea('4')];
    expect(parseIdeas(JSON.stringify({ ideas: list })).map((i) => i.title)).toEqual(['1', '2', '3']);
  });

  it('throws when nothing usable came back', () => {
    expect(() => parseIdeas('Sorry, I cannot help with that.')).toThrow();
    expect(() => parseIdeas(JSON.stringify({ ideas: [] }))).toThrow();
  });
});

describe('normalizeIdea', () => {
  it('cleans types, dedupes lists and defaults difficulty', () => {
    const out = normalizeIdea({
      title: '  Study   Buddy  ',
      description: 'Find partners.',
      features: ['Chat', 'Chat', 42, '', 'Calendar'],
      techStack: 'React',
      difficulty: 'expert??',
    });
    expect(out).toMatchObject({
      title: 'Study Buddy',
      features: ['Chat', 'Calendar'],
      techStack: [],
      difficulty: 'Beginner',
      timeEstimate: '1-2 weeks',
    });
  });

  it('clips very long strings', () => {
    const out = normalizeIdea({ title: 'x'.repeat(500), description: 'd', features: ['f'] });
    expect(out!.title.length).toBeLessThanOrEqual(80);
  });

  it('rejects non-objects', () => {
    expect(normalizeIdea(null)).toBeNull();
    expect(normalizeIdea('idea')).toBeNull();
  });
});

describe('extractJson', () => {
  it('returns undefined for plain text', () => {
    expect(extractJson('no json here')).toBeUndefined();
  });
});

describe('buildIdeasPrompt / isIdeaInputReady', () => {
  it('includes what the student typed and marks blanks', () => {
    const prompt = buildIdeasPrompt({ ...EMPTY_IDEA_INPUT, appName: 'StudyBuddy', description: 'Find study partners' });
    expect(prompt).toContain('App name: StudyBuddy');
    expect(prompt).toContain('Target audience: (not specified)');
  });

  it('needs a name and a description', () => {
    expect(isIdeaInputReady(EMPTY_IDEA_INPUT)).toBe(false);
    expect(isIdeaInputReady({ ...EMPTY_IDEA_INPUT, appName: 'A', description: '  ' })).toBe(false);
    expect(isIdeaInputReady({ ...EMPTY_IDEA_INPUT, appName: 'A', description: 'B' })).toBe(true);
  });
});
