import { buildIdeasPrompt, IDEAS_JSON_SCHEMA, parseIdeas, type Idea, type IdeaInput } from '../ideas';
import { buildPromptsRequest, parseBuildPrompts, PROMPTS_JSON_SCHEMA, type BuildPrompts, type Customization } from '../prompts';
import { extractJson } from '../ideas';
import { getSettings } from '../settings';
import { deepseekChat } from './deepseek';
import { AIError } from './errors';
import { geminiChat, geminiJson } from './gemini';
import type { ChatTurn } from './types';

export { AIError, type AIErrorKind, type AIProvider } from './errors';
export { testGeminiKey } from './gemini';
export type { ChatTurn } from './types';

export async function generateIdeas(input: IdeaInput): Promise<Idea[]> {
  const text = await geminiJson(buildIdeasPrompt(input), IDEAS_JSON_SCHEMA, 0.9);
  try {
    return parseIdeas(text);
  } catch {
    throw new AIError('bad-response', 'gemini');
  }
}

export async function generateBuildPrompts(idea: Idea, customization: Customization): Promise<BuildPrompts> {
  const text = await geminiJson(buildPromptsRequest(idea, customization), PROMPTS_JSON_SCHEMA, 0.7);
  try {
    return parseBuildPrompts(extractJson(text));
  } catch {
    throw new AIError('bad-response', 'gemini');
  }
}

/** Which provider the chat assistant will use: DeepSeek when its key is set, otherwise Gemini. */
export function chatProvider(): 'gemini' | 'deepseek' {
  return getSettings().deepseekApiKey.trim() ? 'deepseek' : 'gemini';
}

export function streamChat(
  history: ChatTurn[],
  system: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return chatProvider() === 'deepseek'
    ? deepseekChat(history, system, onChunk, signal)
    : geminiChat(history, system, onChunk, signal);
}
