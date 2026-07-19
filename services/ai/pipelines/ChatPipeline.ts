import { Task } from '../../../types/task';
import { DashboardService } from '../../DashboardService';
import { Agent } from '../Agent';
import { AIMemoryService } from '../AIMemoryService';
import { ContextBuilder } from '../ContextBuilder';
import { ConversationSummarizer } from '../ConversationSummarizer';
import { LLMGateway } from '../LLMGateway';
import { Observability } from '../Observability';
import { Planner } from '../Planner';
import { Retriever } from '../Retriever';
import { SemanticCache } from '../SemanticCache';
import { AIResponse, ChatMessage } from '../types';

export class ChatPipeline {
  /**
   * Executes the complete AI chat request pipeline.
   */
  static async execute(
    userMessage: string,
    apiKey: string | undefined,
    allTasks: Task[],
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. Retrieve query vector & context
    const retrieval = await Retriever.retrieve(userMessage, allTasks, apiKey);

    // 2. Check Semantic Cache (skip if task actions/mutations might be required)
    const cachedResponse = await SemanticCache.get(retrieval.queryVector);
    if (cachedResponse) {
      Observability.record({
        type: 'cache_hit',
        durationMs: Date.now() - startTime,
      });
      return cachedResponse;
    }

    // 3. Offline fallback check
    if (!LLMGateway.getCapabilities(apiKey).isOnline) {
      return await LLMGateway.processMessage(userMessage, apiKey, allTasks);
    }

    // 4. Check Planner
    const plan = Planner.plan(userMessage);

    let finalResponse: AIResponse;

    if (plan.route === 'SIMPLE_REPLY') {
      // Direct fast answer without tool loop
      const systemPrompt = ContextBuilder.buildSystemPrompt({
        userMessage,
        retrievedTasks: retrieval.tasks,
        memories: retrieval.memories,
      });

      const llmRes = await LLMGateway.chatWithTools(
        systemPrompt,
        [{ role: 'user', content: userMessage }],
        [],
        apiKey
      );

      finalResponse = {
        message: llmRes.text,
        usedMemory: retrieval.memories.length > 0,
      };
    } else {
      // 4. Full Agent loop with tools and retrieval
      const todayMetrics = DashboardService.computeMetrics(allTasks);

      const systemPrompt = ContextBuilder.buildSystemPrompt({
        userMessage,
        retrievedTasks: retrieval.tasks,
        memories: retrieval.memories,
        todaySummary: {
          completedTodayCount: todayMetrics.completedTodayCount,
          todayTasksCount: todayMetrics.todayTasks.length,
          overdueTasksCount: todayMetrics.overdueTasks.length,
        },
      });

      const formattedHistory = chatHistory.map((m) => ({
        role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.text,
      }));

      const agentResponse = await Agent.run(systemPrompt, userMessage, apiKey, formattedHistory);

      finalResponse = {
        ...agentResponse,
        usedMemory: retrieval.memories.length > 0,
      };
    }

    // 5. Save in Semantic Cache if no destructive actions executed
    if (!finalResponse.actions || finalResponse.actions.length === 0) {
      await SemanticCache.set(retrieval.queryVector, finalResponse);
    }

    // 6. Extract memories from user turn (async / background)
    AIMemoryService.processConversation(
      [...chatHistory, { role: 'user', text: userMessage }, { role: 'ai', text: finalResponse.message }],
      apiKey
    ).catch(() => {});

    // 7. Check if conversation history needs summarization
    ConversationSummarizer.summarizeIfNeeded(
      [...chatHistory, { role: 'user', text: userMessage }, { role: 'ai', text: finalResponse.message }],
      apiKey
    ).catch(() => {});

    // 8. Record Observability
    Observability.record({
      type: 'llm_call',
      durationMs: Date.now() - startTime,
      details: { route: plan.route, usedMemory: finalResponse.usedMemory },
    });

    return finalResponse;
  }
}
