import { describe, expect, it } from 'vitest';
import {
  BUILD_REPORT_FENCE,
  computeCompletionPct,
  featureLabels,
  normalizeFeatures,
  toProjectFeatures,
  type ProjectFeature,
} from '@/lib/build-report-model';

describe('normalizeFeatures', () => {
  it('promotes a legacy string[] into ProjectFeature[] with generated ids', () => {
    const out = normalizeFeatures(['Chat', 'Profile', 'Map']);
    expect(out).toEqual([
      { id: 'f1', label: 'Chat', status: 'pending' },
      { id: 'f2', label: 'Profile', status: 'pending' },
      { id: 'f3', label: 'Map', status: 'pending' },
    ]);
  });

  it('keeps structured entries, preserving id, status and note, defaulting unknown status', () => {
    const out = normalizeFeatures([
      { id: 'f1', label: 'Chat', status: 'built' },
      { id: 'f2', label: 'Profile', status: 'nonsense', note: 'half done' },
      { id: 'f3', label: 'Map', status: 'blocked', lastUpdatedFromReport: '2026-11-01T00:00:00Z' },
    ]);
    expect(out).toEqual([
      { id: 'f1', label: 'Chat', status: 'built' },
      { id: 'f2', label: 'Profile', status: 'pending', note: 'half done' },
      { id: 'f3', label: 'Map', status: 'blocked', lastUpdatedFromReport: '2026-11-01T00:00:00Z' },
    ]);
  });

  it('drops empty labels, numbers, null and other junk', () => {
    const out = normalizeFeatures(['Chat', '', 7, null, { label: '  ' }, { label: 'Keep' }]);
    expect(out.map((f) => f.label)).toEqual(['Chat', 'Keep']);
    expect(out.map((f) => f.id)).toEqual(['f1', 'f2']);
  });

  it('returns [] for non-arrays', () => {
    expect(normalizeFeatures(null)).toEqual([]);
    expect(normalizeFeatures('Chat')).toEqual([]);
    expect(normalizeFeatures(undefined)).toEqual([]);
  });

  it('fills in a synthetic id when a structured entry has none', () => {
    const out = normalizeFeatures([{ label: 'A' }, { label: 'B' }]);
    expect(out.map((f) => f.id)).toEqual(['f1', 'f2']);
  });
});

describe('toProjectFeatures', () => {
  it('generates stable, index-based ids and pending status', () => {
    expect(toProjectFeatures(['A', 'B', 'C'])).toEqual([
      { id: 'f1', label: 'A', status: 'pending' },
      { id: 'f2', label: 'B', status: 'pending' },
      { id: 'f3', label: 'C', status: 'pending' },
    ]);
  });

  it('skips blank labels so the id sequence stays dense', () => {
    expect(toProjectFeatures(['A', '', '  ', 'B'])).toEqual([
      { id: 'f1', label: 'A', status: 'pending' },
      { id: 'f2', label: 'B', status: 'pending' },
    ]);
  });
});

describe('featureLabels', () => {
  it('reads labels from both structured and legacy shapes', () => {
    expect(featureLabels([{ id: 'f1', label: 'A', status: 'pending' }])).toEqual(['A']);
    expect(featureLabels(['A', 'B'])).toEqual(['A', 'B']);
    expect(featureLabels(undefined)).toEqual([]);
  });
});

describe('computeCompletionPct', () => {
  const mk = (statuses: Array<ProjectFeature['status']>): ProjectFeature[] =>
    statuses.map((s, i) => ({ id: `f${i + 1}`, label: `L${i + 1}`, status: s }));

  it('is 0 for an empty list, not NaN', () => {
    expect(computeCompletionPct([])).toBe(0);
  });

  it('counts partial as half', () => {
    expect(computeCompletionPct(mk(['built', 'partial', 'missing', 'pending']))).toBe(38); // 1.5 / 4 = 0.375
  });

  it('is 100 when everything built', () => {
    expect(computeCompletionPct(mk(['built', 'built', 'built']))).toBe(100);
  });

  it('is 0 when nothing built or partial', () => {
    expect(computeCompletionPct(mk(['pending', 'missing', 'blocked']))).toBe(0);
  });
});

describe('BUILD_REPORT_FENCE', () => {
  it('is a versioned string the prompt appendix and parser can agree on', () => {
    expect(BUILD_REPORT_FENCE).toMatch(/^companai-report-v\d+$/);
  });
});
