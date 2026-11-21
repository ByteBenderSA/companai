import { describe, expect, it } from 'vitest';
import { BUILD_REPORT_FENCE } from '@/lib/build-report-model';
import { buildPromptAppendix, withLovableAppendix } from '@/lib/prompt-appendix';

const project = {
  id: 'p1',
  features: [
    { id: 'f1', label: 'Sign up with email', status: 'pending' as const },
    { id: 'f2', label: 'Workout log saved to Firestore', status: 'pending' as const },
  ],
};

describe('buildPromptAppendix', () => {
  it('bakes the fence token, project id and each feature id + label into the template', () => {
    const out = buildPromptAppendix(project);
    expect(out).toContain('```' + BUILD_REPORT_FENCE);
    expect(out).toContain('"projectId": "p1"');
    expect(out).toContain('"id": "f1"');
    expect(out).toContain('"label": "Sign up with email"');
    expect(out).toContain('"id": "f2"');
    expect(out).toContain('"label": "Workout log saved to Firestore"');
    expect(out).toMatch(/```[\s\S]*```/); // closing fence present
  });

  it('is empty when the project has no features (nothing to report against)', () => {
    expect(buildPromptAppendix({ id: 'p', features: [] })).toBe('');
  });

  it('JSON-escapes feature labels so quotes and backslashes do not break the block', () => {
    const out = buildPromptAppendix({
      id: 'p',
      features: [{ id: 'f1', label: 'He said "hi"\\n', status: 'pending' }],
    });
    expect(out).toContain('"label": "He said \\"hi\\"\\\\n"');
    // The JSON block, taken alone, parses.
    const block = out.split('```' + BUILD_REPORT_FENCE)[1].split('```')[0];
    expect(() => JSON.parse(block)).not.toThrow();
  });
});

describe('withLovableAppendix', () => {
  it('appends the block to the Lovable prompt only, leaving Cursor alone', () => {
    const out = withLovableAppendix({ lovable: 'Lovable body', cursor: 'Cursor body' }, project);
    expect(out.lovable.startsWith('Lovable body')).toBe(true);
    expect(out.lovable).toContain('```' + BUILD_REPORT_FENCE);
    expect(out.cursor).toBe('Cursor body');
  });

  it('is a pass-through when the project has no features', () => {
    const prompts = { lovable: 'L', cursor: 'C' };
    expect(withLovableAppendix(prompts, { id: 'p', features: [] })).toEqual(prompts);
  });
});
