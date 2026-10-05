import { describe, expect, it } from 'vitest';
import { normalizeProject, projectStatus, timeAgo, toDate, toggleStep } from '@/lib/project-model';

describe('normalizeProject', () => {
  it('reads a legacy document (numbered steps, generatedPrompts, ISO dates)', () => {
    const p = normalizeProject('p1', {
      ownerId: 'u1',
      title: 'Old project',
      description: 'd',
      features: ['a', 7],
      difficulty: 'Expert',
      progress: { completedSteps: [1, 3, 9] },
      generatedPrompts: { lovablePrompt: 'L', cursorPrompt: 'C' },
      createdAt: '2025-07-01T10:00:00.000Z',
    });
    expect(p.completedSteps).toEqual(['lovable', 'cursor']);
    expect(p.prompts).toEqual({ lovable: 'L', cursor: 'C' });
    expect(p.features).toEqual(['a']);
    expect(p.difficulty).toBe('Beginner');
    expect(p.createdAt?.toISOString()).toBe('2025-07-01T10:00:00.000Z');
    expect(p.promptsSource).toBe('ai');
  });

  it('prefers the current prompts field and ignores unknown step ids', () => {
    const p = normalizeProject('p2', {
      title: 'New',
      prompts: { lovable: 'new L' },
      generatedPrompts: { lovablePrompt: 'old L', cursorPrompt: 'old C' },
      completedSteps: ['deploy', 'nonsense', 'lovable'],
      promptsSource: 'template',
    });
    expect(p.prompts).toEqual({ lovable: 'new L', cursor: 'old C' });
    expect(p.completedSteps).toEqual(['lovable', 'deploy']);
    expect(p.promptsSource).toBe('template');
  });

  it('survives an empty document', () => {
    const p = normalizeProject('p3', {});
    expect(p.title).toBe('Untitled project');
    expect(p.updatedAt).toBeNull();
  });
});

describe('toDate', () => {
  it('handles Timestamp-like objects, numbers, junk', () => {
    const d = new Date('2026-01-02T03:04:05Z');
    expect(toDate({ toDate: () => d })).toBe(d);
    expect(toDate(d.getTime())?.getTime()).toBe(d.getTime());
    expect(toDate('not a date')).toBeNull();
    expect(toDate(undefined)).toBeNull();
  });
});

describe('steps and status', () => {
  it('toggles in canonical order', () => {
    expect(toggleStep(['cursor'], 'lovable', true)).toEqual(['lovable', 'cursor']);
    expect(toggleStep(['lovable', 'cursor'], 'lovable', false)).toEqual(['cursor']);
  });

  it('derives status', () => {
    expect(projectStatus([])).toBe('planning');
    expect(projectStatus(['github'])).toBe('building');
    expect(projectStatus(['lovable', 'github', 'cursor', 'deploy'])).toBe('completed');
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  it.each([
    [new Date('2026-10-05T11:59:40Z'), 'just now'],
    [new Date('2026-10-05T11:15:00Z'), '45 min ago'],
    [new Date('2026-10-05T11:00:00Z'), '1 hour ago'],
    [new Date('2026-10-03T12:00:00Z'), '2 days ago'],
  ])('%s', (d, expected) => expect(timeAgo(d, now)).toBe(expected));

  it('is empty for a missing date', () => expect(timeAgo(null, now)).toBe(''));
});
