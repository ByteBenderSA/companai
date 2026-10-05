import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT, normalizeDraft } from '@/lib/draft-model';

const idea = { title: 'A', description: 'd', features: ['f'] };

describe('normalizeDraft', () => {
  it('returns an empty draft for nothing', () => {
    expect(normalizeDraft(undefined)).toEqual(EMPTY_DRAFT);
  });

  it('restores a complete draft', () => {
    const d = normalizeDraft({
      step: 'prompts',
      input: { appName: 'X', description: 'Y', skillLevel: 'advanced' },
      ideas: [idea],
      selectedIndex: 0,
      prompts: { lovable: 'L', cursor: 'C' },
      customization: { layoutStyle: 'grid-gallery' },
    });
    expect(d.step).toBe('prompts');
    expect(d.input.skillLevel).toBe('advanced');
    expect(d.customization.layoutStyle).toBe('grid-gallery');
    expect(d.customization.colorScheme).toBe('modern-purple');
  });

  it('falls back to the furthest valid step when data is missing', () => {
    expect(normalizeDraft({ step: 'prompts', ideas: [idea], selectedIndex: 0 }).step).toBe('customize');
    expect(normalizeDraft({ step: 'customize', ideas: [idea], selectedIndex: 5 }).step).toBe('choose');
    expect(normalizeDraft({ step: 'choose', ideas: [] }).step).toBe('describe');
    expect(normalizeDraft({ step: 'bogus' }).step).toBe('describe');
  });

  it('rejects an unknown skill level', () => {
    expect(normalizeDraft({ input: { skillLevel: 'wizard' } }).input.skillLevel).toBe('beginner');
  });
});
