import OpenAI from 'openai';
import { getSettings, MissingApiKeyError } from './settings';

const getClient = () => {
  const { deepseekApiKey } = getSettings();
  if (!deepseekApiKey) throw new MissingApiKeyError('deepseek');
  return new OpenAI({
    apiKey: deepseekApiKey,
    baseURL: 'https://api.deepseek.com/v1',
    dangerouslyAllowBrowser: true,
  });
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export interface ConversationContext {
  userProgress?: string;
  currentProject?: string;
  lastTopics?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

const SYSTEM_PROMPT = `You are CompanAI's AI coding mentor helping people learn through real projects. Be encouraging, provide step-by-step guidance, and suggest tools like Lovable.dev, Cursor, and Firebase. Keep responses conversational and include code examples when helpful.`;

class DeepSeekService {
  private convertMessages(messages: ChatMessage[], systemPrompt: string): OpenAI.ChatCompletionMessageParam[] {
    const out: OpenAI.ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];
    messages.forEach((msg) => {
      out.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.parts });
    });
    return out;
  }

  async generateStreamingResponse(
    messages: ChatMessage[],
    context?: ConversationContext,
    currentUserMessage?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const client = getClient();

    let systemPrompt = SYSTEM_PROMPT;
    if (context?.currentProject) systemPrompt += `\n\nCurrent Project: ${context.currentProject}`;
    if (context?.skillLevel) systemPrompt += `\nSkill Level: ${context.skillLevel}`;

    const openAIMessages = this.convertMessages(messages, systemPrompt);

    if (currentUserMessage) {
      let withContext = currentUserMessage;
      if (context) {
        let suffix = '';
        if (context.currentProject) suffix += `\n\n[Context: Currently working on project "${context.currentProject}"]`;
        if (context.skillLevel) suffix += `\n[My skill level: ${context.skillLevel}]`;
        if (suffix) withContext = currentUserMessage + suffix;
      }
      openAIMessages.push({ role: 'user', content: withContext });
    }

    const stream = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }
    return fullResponse;
  }

  async generateResponse(messages: ChatMessage[], context?: ConversationContext): Promise<string> {
    return this.generateStreamingResponse(messages, context);
  }

  analyzeUserMessageSync(message: string): {
    intent: 'question' | 'help_request' | 'project_idea' | 'debug_help' | 'general';
    topics: string[];
    urgency: 'low' | 'medium' | 'high';
  } {
    const lower = message.toLowerCase();
    let intent: 'question' | 'help_request' | 'project_idea' | 'debug_help' | 'general' = 'general';
    if (lower.includes('help') || lower.includes('how to')) intent = 'help_request';
    else if (lower.includes('?')) intent = 'question';
    else if (lower.includes('error') || lower.includes('bug')) intent = 'debug_help';
    else if (lower.includes('project') || lower.includes('app') || lower.includes('build')) intent = 'project_idea';

    const topics: string[] = [];
    const keywords = ['react', 'javascript', 'python', 'css', 'html', 'firebase', 'api', 'database'];
    keywords.forEach((k) => { if (lower.includes(k)) topics.push(k); });

    const urgency = lower.includes('urgent') || lower.includes('asap') ? 'high' : 'medium';
    return { intent, topics, urgency };
  }
}

export const deepseekService = new DeepSeekService();
