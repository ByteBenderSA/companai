import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSettings, MissingApiKeyError } from './settings';

const getClient = () => {
  const { geminiApiKey } = getSettings();
  if (!geminiApiKey) throw new MissingApiKeyError('gemini');
  return new GoogleGenerativeAI(geminiApiKey);
};

const getModel = () => getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });

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

class GeminiService {
  async generateStreamingResponse(
    messages: ChatMessage[],
    context?: ConversationContext,
    currentUserMessage?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const model = getModel();

    const chatHistory = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    if (chatHistory.length === 0) {
      chatHistory.push({ role: 'user', parts: [{ text: 'Hello, I need help with coding.' }] });
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.8, maxOutputTokens: 1000 },
    });

    let messageToSend = currentUserMessage || messages[messages.length - 1]?.parts;
    if (!messageToSend) throw new Error('No message to send');

    if (context) {
      let suffix = '';
      if (context.currentProject) suffix += `\n\n[Context: Currently working on project "${context.currentProject}"]`;
      if (context.skillLevel) suffix += `\n[My skill level: ${context.skillLevel}]`;
      if (suffix) messageToSend = messageToSend + suffix;
    }

    if (chatHistory.length <= 1) {
      messageToSend = `${SYSTEM_PROMPT}\n\nUser question: ${messageToSend}`;
    }

    const result = await chat.sendMessageStream(messageToSend);
    let fullResponse = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onChunk?.(chunkText);
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

  async generateProjectIdea(userInput?: string, skillLevel?: string): Promise<string> {
    const prompt = `You are an expert product analyst and technical architect. Your job is to take a user's app idea and create 3 unique, innovative project variations that truly reflect their specific vision.

DO NOT default to generic app patterns. Deeply analyze what the user is trying to achieve and build on their concept.

User's App Vision:
${userInput || 'No specific input provided'}

Skill Level: ${skillLevel || 'Beginner'}

Return 3 ideas separated by "---" in this exact JSON format for each:

{
  "title": "[Specific descriptive name]",
  "description": "[2-3 sentences capturing the use case and value proposition]",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "techStack": ["React", "TypeScript", "Tailwind CSS", "Firebase", "[AI/API mentioned]", "[Additional tech]"],
  "difficulty": "Beginner",
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
  "timeEstimate": "2-4 weeks",
  "marketPotential": "Medium"
}

Generate 3 distinct variations now.`;

    const result = await getModel().generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, topK: 40, topP: 0.9, maxOutputTokens: 3000 },
    });
    return result.response.text();
  }

  async generateLongFormPrompt(prompt: string): Promise<string> {
    const result = await getModel().generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.8, maxOutputTokens: 4000 },
    });
    return result.response.text();
  }

  async generateRefinedPrompt(
    selectedIdea: unknown,
    customization: {
      colorScheme: string;
      layoutStyle: string;
      fontVibe: string;
      features: string[];
      customFeatures: string;
      userFlow: string;
      customHexColor?: string;
    }
  ): Promise<string> {
    const colorInfo =
      customization.colorScheme === 'custom'
        ? `Custom color: ${customization.customHexColor}`
        : customization.colorScheme.replace('-', ' ');

    const prompt = `You are an expert technical architect. Based on the selected app idea and user customizations, generate comprehensive development prompts for both Lovable.dev (frontend) and Cursor (backend).

SELECTED APP IDEA:
${JSON.stringify(selectedIdea, null, 2)}

USER CUSTOMIZATIONS:
- Color Scheme: ${colorInfo}
- Layout Style: ${customization.layoutStyle}
- Font Style: ${customization.fontVibe}
- Selected Features: ${customization.features.join(', ')}
- Custom Features: ${customization.customFeatures}
- User Flow: ${customization.userFlow}

Format the response as:

## LOVABLE.DEV PROMPT
[Detailed frontend prompt here]

## CURSOR PROMPT
[Detailed backend prompt here]`;

    const result = await getModel().generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, topK: 40, topP: 0.8, maxOutputTokens: 4000 },
    });
    return result.response.text();
  }
}

export const geminiService = new GeminiService();
