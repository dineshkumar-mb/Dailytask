import { GeminiProvider } from './providers/GeminiProvider';
import { OfflineProvider } from './providers/OfflineProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import {
  AIResponse,
  LLMMessage,
  LLMResponse,
  ProviderCapabilities,
  ToolDefinition,
} from './types';
import { Logger } from '../Logger';

export class LLMGateway {
  static getCapabilities(apiKey?: string): ProviderCapabilities {
    if (!apiKey) {
      return {
        supportsToolCalling: false,
        supportsEmbeddings: false,
        maxTokens: 1000,
        isOnline: false,
      };
    }

    if (apiKey.startsWith('sk-or-')) {
      return {
        supportsToolCalling: true,
        supportsEmbeddings: false,
        maxTokens: 4000,
        isOnline: true,
      };
    }

    return {
      supportsToolCalling: true,
      supportsEmbeddings: true,
      maxTokens: 8000,
      isOnline: true,
    };
  }

  static async processMessage(
    userMessage: string,
    apiKey: string | undefined,
    taskContext: any[]
  ): Promise<AIResponse> {
    const caps = this.getCapabilities(apiKey);

    if (!caps.isOnline || !apiKey) {
      const offline = new OfflineProvider();
      return await offline.processMessage(userMessage, taskContext);
    }

    if (apiKey.startsWith('sk-or-')) {
      const openRouter = new OpenRouterProvider(apiKey);
      return await openRouter.processMessage(userMessage, taskContext);
    }

    const gemini = new GeminiProvider(apiKey);
    return await gemini.processMessage(userMessage, taskContext);
  }

  static async chatWithTools(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: ToolDefinition[],
    apiKey?: string
  ): Promise<LLMResponse> {
    const caps = this.getCapabilities(apiKey);
    const startTime = Date.now();

    if (!caps.isOnline || !apiKey) {
      // Offline fallback text answer
      const offline = new OfflineProvider();
      const userLast = messages.filter((m) => m.role === 'user').pop()?.content || '';
      const res = await offline.processMessage(userLast, []);
      return { text: res.message };
    }

    try {
      if (apiKey.startsWith('sk-or-')) {
        const openRouter = new OpenRouterProvider(apiKey);
        const res = await openRouter.processMessageWithTools(systemPrompt, messages, tools);
        Logger.info(`[LLMGateway] OpenRouter response in ${Date.now() - startTime}ms`);
        return res;
      }

      const gemini = new GeminiProvider(apiKey);
      const res = await gemini.processMessageWithTools(systemPrompt, messages, tools);
      Logger.info(`[LLMGateway] Gemini response in ${Date.now() - startTime}ms`);
      return res;
    } catch (error) {
      Logger.error('[LLMGateway] Primary provider failed, falling back to offline NLP', error);
      const offline = new OfflineProvider();
      const userLast = messages.filter((m) => m.role === 'user').pop()?.content || '';
      const res = await offline.processMessage(userLast, []);
      return { text: res.message };
    }
  }
}
