import { describe, expect, it } from 'vitest';
import { BUILD_REPORT_FENCE, type ProjectFeature } from '@/lib/build-report-model';
import { buildGapPrompt, extractFromFence, validateParsedReport, type ParsedReport } from '@/lib/build-report-parse';

const knownIds = new Set(['f1', 'f2', 'f3']);

const features: ProjectFeature[] = [
  { id: 'f1', label: 'Sign up', status: 'pending' },
  { id: 'f2', label: 'Dashboard', status: 'pending' },
  { id: 'f3', label: 'Upload avatar', status: 'pending' },
];

const makeFence = (payload: unknown) => `Here's what I built:

${'```'}${BUILD_REPORT_FENCE}
${JSON.stringify(payload)}
${'```'}

Enjoy!`;

describe('extractFromFence', () => {
  it('reads the fence, drops unknown ids and invalid statuses', () => {
    const paste = makeFence({
      projectId: 'p1',
      features: [
        { id: 'f1', status: 'built' },
        { id: 'f2', status: 'partial', note: 'avatar missing' },
        { id: 'fX', status: 'built' }, // unknown id, dropped
        { id: 'f3', status: 'nonsense' }, // bad status, dropped
      ],
      blockers: ['Firebase not configured'],
      filesChanged: ['src/pages/Dashboard.tsx'],
    });
    const out = extractFromFence(paste, knownIds);
    expect(out).not.toBeNull();
    expect(out!.projectId).toBe('p1');
    expect(out!.features).toEqual([
      { id: 'f1', status: 'built' },
      { id: 'f2', status: 'partial', note: 'avatar missing' },
    ]);
    expect(out!.blockers).toEqual(['Firebase not configured']);
    expect(out!.filesChanged).toEqual(['src/pages/Dashboard.tsx']);
  });

  it('returns null when there is no fence (caller should fall back to Gemini)', () => {
    expect(extractFromFence('Just plain text, no fence here.', knownIds)).toBeNull();
  });

  it('returns null when the fenced content is not JSON', () => {
    const paste = `${'```'}${BUILD_REPORT_FENCE}\n{not json\n${'```'}`;
    expect(extractFromFence(paste, knownIds)).toBeNull();
  });

  it('deduplicates feature ids — the first occurrence wins', () => {
    const paste = makeFence({
      features: [
        { id: 'f1', status: 'built' },
        { id: 'f1', status: 'missing' },
      ],
    });
    expect(extractFromFence(paste, knownIds)!.features).toEqual([{ id: 'f1', status: 'built' }]);
  });
});

describe('validateParsedReport', () => {
  it('caps features at 30, blockers at 20, filesChanged at 100', () => {
    const many = (n: number, mk: (i: number) => unknown) => Array.from({ length: n }, (_, i) => mk(i));
    const ids = new Set<string>();
    for (let i = 0; i < 40; i++) ids.add(`f${i}`);
    const out = validateParsedReport(
      {
        features: many(40, (i) => ({ id: `f${i}`, status: 'built' })),
        blockers: many(30, (i) => `b${i}`),
        filesChanged: many(150, (i) => `src/x${i}.ts`),
      },
      ids
    );
    expect(out.features.length).toBe(30);
    expect(out.blockers.length).toBe(20);
    expect(out.filesChanged.length).toBe(100);
  });

  it('truncates overlong notes and blockers to 500 chars', () => {
    const long = 'x'.repeat(2000);
    const out = validateParsedReport(
      { features: [{ id: 'f1', status: 'built', note: long }], blockers: [long] },
      knownIds
    );
    expect(out.features[0].note!.length).toBe(500);
    expect(out.blockers[0].length).toBe(500);
  });

  it('returns an empty report on non-object input', () => {
    expect(validateParsedReport(null, knownIds)).toEqual({ features: [], blockers: [], filesChanged: [] });
    expect(validateParsedReport('not json', knownIds)).toEqual({ features: [], blockers: [], filesChanged: [] });
  });
});

describe('buildGapPrompt', () => {
  const project = { title: 'FitTrack', features };

  it('lists only missing/partial/blocked features, with verb hints and optional notes', () => {
    const report: ParsedReport = {
      features: [
        { id: 'f1', status: 'built' },
        { id: 'f2', status: 'partial', note: 'avatar section not wired up' },
        { id: 'f3', status: 'blocked', note: 'Firebase storage not set up' },
      ],
      blockers: ['Need a Firebase storage bucket'],
      filesChanged: [],
    };
    const out = buildGapPrompt(project, report)!;
    expect(out).toContain('# Follow-up build prompt — FitTrack');
    expect(out).not.toContain('[f1]');
    expect(out).toContain('**finish** [f2] Dashboard — last build: avatar section not wired up');
    expect(out).toContain('**unblock** [f3] Upload avatar — last build: Firebase storage not set up');
    expect(out).toContain('Need a Firebase storage bucket');
    // The gap prompt asks the next build to re-emit the same fence; token is referenced inline.
    expect(out).toContain(BUILD_REPORT_FENCE);
  });

  it('returns undefined when every feature on the project is built (nothing left to prompt)', () => {
    const report: ParsedReport = {
      features: features.map((f) => ({ id: f.id, status: 'built' as const })),
      blockers: [],
      filesChanged: [],
    };
    expect(buildGapPrompt(project, report)).toBeUndefined();
  });

  it('treats features the report did not touch but whose project status is pending as "missing"', () => {
    const report: ParsedReport = {
      features: [{ id: 'f1', status: 'built' }], // f2, f3 untouched; still pending on the project
      blockers: [],
      filesChanged: [],
    };
    const out = buildGapPrompt(project, report)!;
    expect(out).toContain('**add** [f2] Dashboard');
    expect(out).toContain('**add** [f3] Upload avatar');
  });
});
