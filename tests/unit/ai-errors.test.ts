import { describe, expect, it } from 'vitest';
import { AIError, classifyAIError } from '@/lib/ai/errors';
import { parseSseChunk } from '@/lib/ai/deepseek';

const withStatus = (status: number, message = 'x') => Object.assign(new Error(message), { status });

describe('classifyAIError', () => {
  it.each([
    [withStatus(400, 'API key not valid. Please pass a valid API key.'), 'invalid-key'],
    [withStatus(403), 'invalid-key'],
    [withStatus(429, 'RESOURCE_EXHAUSTED'), 'rate-limit'],
    [new Error('You exceeded your current quota'), 'rate-limit'],
    [withStatus(404, 'models/gemini-2.0-flash is not found for API version v1beta'), 'model-unavailable'],
    [new TypeError('Failed to fetch'), 'network'],
    [new Error('Response was blocked due to SAFETY'), 'blocked'],
    [withStatus(503, 'overloaded'), 'unknown'],
    ['weird', 'unknown'],
  ])('%s → %s', (err, kind) => {
    expect(classifyAIError(err, 'gemini').kind).toBe(kind);
  });

  it('passes AIErrors through unchanged', () => {
    const e = new AIError('missing-key', 'deepseek');
    expect(classifyAIError(e, 'gemini')).toBe(e);
  });

  it('flags settings-fixable errors and names the provider', () => {
    const e = classifyAIError(withStatus(401), 'deepseek');
    expect(e.fixInSettings).toBe(true);
    expect(e.message).toContain('DeepSeek');
    expect(classifyAIError(withStatus(429), 'gemini').fixInSettings).toBe(false);
  });

  it('mentions the status code for server errors', () => {
    expect(classifyAIError(withStatus(500), 'gemini').message).toContain('500');
  });
});

describe('parseSseChunk', () => {
  const line = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`;

  it('collects deltas and keeps an incomplete trailing line', () => {
    const { deltas, rest, done } = parseSseChunk(line('Hel') + line('lo') + 'data: {"choi');
    expect(deltas).toEqual(['Hel', 'lo']);
    expect(rest).toBe('data: {"choi');
    expect(done).toBe(false);
  });

  it('detects [DONE] and ignores keep-alives and junk', () => {
    const { deltas, done } = parseSseChunk(': keep-alive\n' + line('a') + 'data: not-json\n' + 'data: [DONE]\n');
    expect(deltas).toEqual(['a']);
    expect(done).toBe(true);
  });
});
