import { AIProvider, AIResponse, LLMMessage, LLMResponse, ToolDefinition } from '../types';

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse> {
    const systemInstruction = `You are a personal productivity AI assistant for the DailyTask application.
Today's local date and time is ${new Date().toString()}.
The user's current list of incomplete tasks in the database is:
${JSON.stringify(taskContext.map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })))}

You can execute actions on the user's behalf.
Available actions:
1. ADD_TASK: payload has { "title": string, "priority": "Low"|"Medium"|"High", "dueDate": "ISO string" or null }
2. COMPLETE_TASK: payload has { "taskId": string }
3. DELETE_TASK: payload has { "taskId": string }
4. FOCUS_TASK: payload has { "taskId": string }

Return JSON conforming exactly to:
{
  "message": "Your text response",
  "actions": [ { "type": "ADD_TASK" | "COMPLETE_TASK" | "DELETE_TASK" | "FOCUS_TASK", "payload": { ... } } ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-001',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const resData = await response.json();
    const contentStr = resData.choices?.[0]?.message?.content;
    if (!contentStr) {
      throw new Error('Empty response from OpenRouter');
    }

    return JSON.parse(contentStr) as AIResponse;
  }

  async processMessageWithTools(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: ToolDefinition[]
  ): Promise<LLMResponse> {
    const formattedTools =
      tools.length > 0
        ? tools.map((t) => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: (m.role as string) === 'ai' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-001',
        messages: formattedMessages,
        tools: formattedTools,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const resData = await response.json();
    const message = resData.choices?.[0]?.message;
    if (!message) {
      throw new Error('Empty choice response from OpenRouter');
    }

    const toolCalls: any[] = [];
    if (Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls) {
        try {
          toolCalls.push({
            name: tc.function.name,
            args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments,
          });
        } catch (e) {}
      }
    }

    return {
      text: message.content || (toolCalls.length > 0 ? 'Executing action...' : ''),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
}
