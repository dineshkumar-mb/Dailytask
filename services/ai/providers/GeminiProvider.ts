import { AIProvider, AIResponse, LLMMessage, LLMResponse, ToolDefinition } from '../types';

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse> {
    const systemInstruction = `You are a personal productivity AI assistant for the DailyTask application.
Today's local date and time is ${new Date().toString()}.
The user's current list of incomplete tasks in the database is:
${JSON.stringify(taskContext.map((t) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })))}

You can execute actions on the user's behalf. If the user asks you to add, complete, delete, or focus on a task, include the action in the "actions" array.
Available actions:
1. ADD_TASK: payload has { "title": string, "priority": "Low"|"Medium"|"High", "dueDate": "ISO string" or null }
2. COMPLETE_TASK: payload has { "taskId": string }
3. DELETE_TASK: payload has { "taskId": string }
4. FOCUS_TASK: payload has { "taskId": string }

Return a JSON object conforming exactly to this schema:
{
  "message": "Your text response to the user.",
  "actions": [
    { "type": "ADD_TASK" | "COMPLETE_TASK" | "DELETE_TASK" | "FOCUS_TASK", "payload": { ... } }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const resData = await response.json();
    const responseJsonStr = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseJsonStr) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(responseJsonStr) as AIResponse;
  }

  async processMessageWithTools(
    systemPrompt: string,
    messages: LLMMessage[],
    tools: ToolDefinition[]
  ): Promise<LLMResponse> {
    const geminiTools =
      tools.length > 0
        ? [
            {
              functionDeclarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ]
        : undefined;

    const contents = messages.map((m) => {
      let role = 'user';
      if (m.role === 'assistant') role = 'model';
      if (m.role === 'system') role = 'user';
      return {
        role,
        parts: [{ text: m.content }],
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          tools: geminiTools,
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const resData = await response.json();
    const candidate = resData.candidates?.[0]?.content;
    if (!candidate || !candidate.parts) {
      throw new Error('Empty response from Gemini API');
    }

    let textResponse = '';
    const toolCalls: any[] = [];

    for (const part of candidate.parts) {
      if (part.text) {
        textResponse += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    return {
      text: textResponse.trim() || (toolCalls.length > 0 ? 'Executing request...' : ''),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }
}
