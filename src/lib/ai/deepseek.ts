import { DEFAULT_DEEPSEEK_MODEL, getSettings } from '../settings';
import { AIError, classifyAIError } from './errors';
import type { ChatTurn } from './types';

const ENDPOINT = 'https://api.deepseek.com/chat/completions';

/**
 * Pull the text deltas out of a chunk of an OpenAI-style server-sent-event stream.
 * `buffer` carries an incomplete trailing line over to the next call.
 */
export function parseSseChunk(buffer: string): { deltas: string[]; rest: string; done: boolean } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const deltas: string[] = [];
  let done = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') {
      done = true;
      continue;
    }
    try {
      const json = JSON.parse(data) as { choices?: { delta?: { content?: unknown } }[] };
      const content = json.choices?.[0]?.delta?.content;
      if (typeof content === 'string' && content) deltas.push(content);
    } catch {
      // Ignore keep-alive comments and malformed lines.
    }
  }
  return { deltas, rest, done };
}

export async function deepseekChat(
  history: ChatTurn[],
  system: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const apiKey = getSettings().deepseekApiKey.trim();
  if (!apiKey) throw new AIError('missing-key', 'deepseek');

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEFAULT_DEEPSEEK_MODEL,
        stream: true,
        temperature: 0.7,
        messages: [{ role: 'system', content: system }, ...history],
      }),
      signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw Object.assign(new Error(detail || res.statusText), { status: res.status });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseChunk(buffer);
      buffer = parsed.rest;
      if (parsed.deltas.length) {
        full += parsed.deltas.join('');
        onChunk(full);
      }
      if (parsed.done) break;
    }
    if (!full.trim()) throw new AIError('bad-response', 'deepseek');
    return full;
  } catch (err) {
    throw classifyAIError(err, 'deepseek');
  }
}
