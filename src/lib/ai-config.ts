import { geminiService } from './gemini';
import { deepseekService } from './deepseek';
import { getSettings } from './settings';

export { geminiService } from './gemini';
export { deepseekService } from './deepseek';
export type { ChatMessage, ConversationContext } from './gemini';

// Idea generation always uses Gemini.
// The chat assistant uses DeepSeek if the user configured a key, otherwise falls back to Gemini.
export const getChatService = () => {
  const { deepseekApiKey } = getSettings();
  return deepseekApiKey ? deepseekService : geminiService;
};

export const aiService = geminiService;
