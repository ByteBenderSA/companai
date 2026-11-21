import { describe, expect, it } from 'vitest';
import { ideaFromProject, newProjectFields, normalizeProject, projectStatus, timeAgo, toDate, toggleStep } from '@/lib/project-model';

describe('normalizeProject', () => {
  it('reads a legacy document (numbered steps, generatedPrompts, ISO dates, string[] features)', () => {
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
    // Legacy string[] features are promoted to ProjectFeature[] with generated ids and pending status.
    expect(p.features).toEqual([{ id: 'f1', label: 'a', status: 'pending' }]);
    expect(p.completionPct).toBeUndefined();
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

  it('reads structured features and keeps per-feature status, with completionPct derived when absent', () => {
    const p = normalizeProject('p4', {
      title: 'Reported',
      features: [
        { id: 'f1', label: 'Chat', status: 'built' },
        { id: 'f2', label: 'Profile', status: 'partial', note: 'avatar missing' },
        { id: 'f3', label: 'Map', status: 'missing' },
      ],
    });
    expect(p.features[0]).toEqual({ id: 'f1', label: 'Chat', status: 'built' });
    expect(p.features[1].note).toBe('avatar missing');
    expect(p.completionPct).toBe(50); // 1 + 0.5 + 0 of 3 = 50%
  });

  it('prefers the stored completionPct over the derived one', () => {
    const p = normalizeProject('p5', {
      title: 'Stored pct',
      features: [{ id: 'f1', label: 'Chat', status: 'built' }],
      completionPct: 73,
    });
    expect(p.completionPct).toBe(73);
  });

  it('survives an empty document', () => {
    const p = normalizeProject('p3', {});
    expect(p.title).toBe('Untitled project');
    expect(p.features).toEqual([]);
    expect(p.completionPct).toBeUndefined();
    expect(p.updatedAt).toBeNull();
  });
});

describe('newProjectFields', () => {
  it('converts the idea\'s string[] features into structured ProjectFeature[]', () => {
    const fields = newProjectFields(
      'alice',
      {
        title: 'StudyBuddy',
        description: 'd',
        features: ['Chat', 'Profile'],
        techStack: ['React'],
        difficulty: 'Beginner',
        timeEstimate: '1 week',
        learningObjectives: [],
      },
      { lovable: 'L', cursor: 'C' },
      'ai'
    );
    expect(fields.features).toEqual([
      { id: 'f1', label: 'Chat', status: 'pending' },
      { id: 'f2', label: 'Profile', status: 'pending' },
    ]);
  });
});

describe('ideaFromProject', () => {
  it('round-trips a project back to an idea using feature labels only', () => {
    const p = normalizeProject('p1', {
      title: 'T',
      features: [
        { id: 'f1', label: 'Chat', status: 'built' },
        { id: 'f2', label: 'Profile', status: 'partial' },
      ],
    });
    expect(ideaFromProject(p).features).toEqual(['Chat', 'Profile']);
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
