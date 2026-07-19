import { LLMGateway } from './LLMGateway';
import { ToolRegistry } from './ToolRegistry';
import { AIAction, AIResponse, LLMMessage } from './types';
import { Logger } from '../Logger';

export class Agent {
  private static MAX_TOOL_ITERATIONS = 5;

  /**
   * Runs the multi-step agent tool-calling loop.
   */
  static async run(
    systemPrompt: string,
    userMessage: string,
    apiKey?: string,
    chatHistory: LLMMessage[] = []
  ): Promise<AIResponse> {
    const tools = ToolRegistry.getAll();
    const actionsExecuted: AIAction[] = [];
    const toolCallsExecutedNames: string[] = [];

    const messages: LLMMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessage },
    ];

    let iterations = 0;
    let finalAnswer = '';

    while (iterations < this.MAX_TOOL_ITERATIONS) {
      iterations++;
      Logger.info(`[Agent] Iteration ${iterations}/${this.MAX_TOOL_ITERATIONS}`);

      const response = await LLMGateway.chatWithTools(
        systemPrompt,
        messages,
        tools,
        apiKey
      );

      if (response.text) {
        finalAnswer = response.text;
      }

      // If no tool calls requested, we have reached the final answer
      if (!response.toolCalls || response.toolCalls.length === 0) {
        break;
      }

      // Execute requested tools
      for (const toolCall of response.toolCalls) {
        toolCallsExecutedNames.push(toolCall.name);
        const toolResult = await ToolRegistry.execute(toolCall.name, toolCall.args, { apiKey });

        if (toolResult.action) {
          actionsExecuted.push(toolResult.action);
        }

        // Append assistant tool request and tool execution result to message history for next turn
        messages.push({
          role: 'assistant',
          content: `Executed tool ${toolCall.name}`,
        });

        messages.push({
          role: 'tool',
          name: toolCall.name,
          content: JSON.stringify(toolResult.success ? toolResult.data || 'Success' : { error: toolResult.error }),
        });
      }
    }

    return {
      message: finalAnswer || 'Task completed.',
      actions: actionsExecuted.length > 0 ? actionsExecuted : undefined,
      toolCallsExecuted: toolCallsExecutedNames.length > 0 ? toolCallsExecutedNames : undefined,
    };
  }
}
