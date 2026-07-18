import { AIProvider, AIResponse } from './types';
import { OfflineProvider } from './providers/OfflineProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';

export class AIService {
  static getProvider(apiKey: string | undefined): AIProvider {
    if (!apiKey) {
      return new OfflineProvider();
    }
    if (apiKey.startsWith('sk-or-')) {
      return new OpenRouterProvider(apiKey);
    }
    return new GeminiProvider(apiKey);
  }

  static async processMessage(userMessage: string, apiKey: string | undefined, taskContext: any[]): Promise<AIResponse> {
    const provider = this.getProvider(apiKey);
    return await provider.processMessage(userMessage, taskContext);
  }
}
