import { describe, expect, it } from 'vitest';
import { authErrorMessage, isUserCancelled } from '@/lib/auth-errors';
import { BUILD_STEPS, slugify } from '@/lib/build-steps';
import { buildMentorSystemPrompt, starterQuestions } from '@/lib/mentor';
import { normalizeProject } from '@/lib/project-model';
import { LESSONS } from '@/lib/lessons';
import { BUILD_STEP_IDS } from '@/lib/project-model';

describe('authErrorMessage', () => {
  it('maps common Firebase codes to friendly text', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toMatch(/don't match/);
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(/already exists/);
    expect(authErrorMessage({ code: 'auth/unauthorized-domain' })).toMatch(/Authorized domains|authorised/i);
    expect(authErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
  it('recognises a closed Google popup', () => {
    expect(isUserCancelled({ code: 'auth/popup-closed-by-user' })).toBe(true);
    expect(isUserCancelled({ code: 'auth/popup-blocked' })).toBe(false);
  });
});

describe('build steps', () => {
  it('covers every step id exactly once, in order', () => {
    expect(BUILD_STEPS.map((s) => s.id)).toEqual([...BUILD_STEP_IDS]);
  });
  it('interpolates the project name and a safe repo slug', () => {
    const guide = BUILD_STEPS.find((s) => s.id === 'github')!.guide('Café Finder: Pro!');
    expect(guide).toContain('cafe-finder-pro');
  });
  it('slugify never returns an empty or dash-edged slug', () => {
    expect(slugify('!!!')).toBe('my-app');
    expect(slugify('  Hello World  ')).toBe('hello-world');
    expect(slugify('x'.repeat(100)).length).toBeLessThanOrEqual(40);
  });
});

describe('mentor prompt', () => {
  const project = normalizeProject('p', {
    title: 'StudyBuddy',
    description: 'Match students',
    features: ['Chat'],
    completedSteps: ['lovable'],
  });
  it('includes project context and the next stage', () => {
    const prompt = buildMentorSystemPrompt(project);
    expect(prompt).toContain('Title: StudyBuddy');
    expect(prompt).toContain('next stage is "Connect GitHub"');
  });
  it('suggests questions for the current stage', () => {
    expect(starterQuestions(project).join(' ')).toMatch(/GitHub|clone/i);
    expect(starterQuestions(null)).toHaveLength(3);
  });
});

describe('lessons', () => {
  it('have unique ids and https resources', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) for (const r of l.resources) expect(r.url).toMatch(/^https:\/\//);
  });
});
