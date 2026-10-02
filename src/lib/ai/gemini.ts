import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { geminiModel, getSettings } from '../settings';
import { AIError, classifyAIError } from './errors';
import type { ChatTurn } from './types';

function client(): { ai: GoogleGenAI; model: string } {
  const settings = getSettings();
  const apiKey = settings.geminiApiKey.trim();
  if (!apiKey) throw new AIError('missing-key', 'gemini');
  return { ai: new GoogleGenAI({ apiKey }), model: geminiModel(settings) };
}

function textOf(response: GenerateContentResponse): string {
  const text = response.text;
  if (text && text.trim()) return text;
  const blocked = response.promptFeedback?.blockReason;
  const finish = response.candidates?.[0]?.finishReason;
  if (blocked || finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT' || finish === 'RECITATION') {
    throw new AIError('blocked', 'gemini');
  }
  throw new AIError('bad-response', 'gemini');
}

/** A 400 that is about the request shape (e.g. an unsupported schema keyword), not the key. */
function isSchemaRejection(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  const message = err instanceof Error ? err.message.toLowerCase() : '';
  return status === 400 && !/api key|api_key/.test(message);
}

/** One-shot request that must come back as JSON matching `schema`. Returns the raw JSON text. */
export async function geminiJson(prompt: string, schema: unknown, temperature = 0.8): Promise<string> {
  const { ai, model } = client();
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
      },
    });
    return textOf(response);
  } catch (err) {
    if (!isSchemaRejection(err)) throw classifyAIError(err, 'gemini');
  }
  // Some models reject parts of a JSON schema. Retry once in plain JSON mode with the schema
  // spelled out in the prompt; the parsers tolerate loosely formatted answers.
  try {
    const response = await ai.models.generateContent({
      model,
      contents: `${prompt}\n\nRespond with JSON only, matching this JSON Schema:\n${JSON.stringify(schema)}`,
      config: { temperature, responseMimeType: 'application/json' },
    });
    return textOf(response);
  } catch (err) {
    throw classifyAIError(err, 'gemini');
  }
}

/** Streams a chat reply. `history` must end with the user's new message. */
export async function geminiChat(
  history: ChatTurn[],
  system: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const { ai, model } = client();
  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents: history.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
      config: { systemInstruction: system, temperature: 0.7, abortSignal: signal },
    });
    let full = '';
    for await (const chunk of stream) {
      const piece = chunk.text ?? '';
      if (piece) {
        full += piece;
        onChunk(full);
      }
    }
    if (!full.trim()) throw new AIError('bad-response', 'gemini');
    return full;
  } catch (err) {
    throw classifyAIError(err, 'gemini');
  }
}

/** Cheap request used by Settings → "Test key". */
export async function testGeminiKey(): Promise<void> {
  const { ai, model } = client();
  try {
    await ai.models.generateContent({ model, contents: 'Reply with the single word: OK' });
  } catch (err) {
    throw classifyAIError(err, 'gemini');
  }
}
