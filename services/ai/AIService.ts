import { Task } from '../../types/task';
import { ChatPipeline } from './pipelines/ChatPipeline';
import { IndexingPipeline } from './pipelines/IndexingPipeline';
import { registerAnalyticsTools } from './tools/AnalyticsTools';
import { registerCalendarTools } from './tools/CalendarTools';
import { registerFocusTools } from './tools/FocusTools';
import { registerMemoryTools } from './tools/MemoryTools';
import { registerTaskTools } from './tools/TaskTools';
import { AIProvider, AIResponse, ChatMessage } from './types';
import { LLMGateway } from './LLMGateway';
import { SemanticCache } from './SemanticCache';

let toolsRegistered = false;

export class AIService {
  /**
   * Initializes all tool definitions into the ToolRegistry once.
   */
  static initTools(): void {
    if (toolsRegistered) return;
    registerTaskTools();
    registerMemoryTools();
    registerCalendarTools();
    registerFocusTools();
    registerAnalyticsTools();
    toolsRegistered = true;
  }

  /**
   * Returns AIProvider instance for legacy compatibility.
   */
  static getProvider(apiKey: string | undefined): AIProvider {
    return {
      processMessage: async (userMessage: string, taskContext: any[]) => {
        return this.processMessage(userMessage, apiKey, taskContext);
      },
    };
  }

  /**
   * Main entry point for processing AI user messages via ChatPipeline.
   */
  static async processMessage(
    userMessage: string,
    apiKey: string | undefined,
    taskContext: Task[],
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    this.initTools();

    // Trigger background indexing for task context (non-blocking)
    IndexingPipeline.enqueueTasks(taskContext, apiKey);

    return await ChatPipeline.execute(userMessage, apiKey, taskContext, chatHistory);
  }

  /**
   * Enqueues a task for background vector re-indexing on create or update.
   */
  static indexTask(task: Task, apiKey?: string): void {
    IndexingPipeline.enqueueSingle(task, apiKey);
  }

  /**
   * Invalidates semantic cache on task mutations.
   */
  static invalidateCache(): void {
    SemanticCache.invalidate().catch(() => {});
  }
}
