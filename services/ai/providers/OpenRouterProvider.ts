import { AIProvider, AIResponse } from '../types';

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse> {
    const systemInstruction = `You are a personal productivity AI assistant for the DailyTask application.
Today's local date and time is ${new Date().toString()}.
The user's current list of incomplete tasks in the database is:
${JSON.stringify(taskContext.map(t => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate })))}

You can execute actions on the user's behalf. If the user asks you to add, complete, delete, or focus on a task, include the action in the "actions" array.
Available actions:
1. ADD_TASK: payload has { "title": string, "priority": "Low"|"Medium"|"High", "dueDate": "ISO string" or null }
2. COMPLETE_TASK: payload has { "taskId": string }
3. DELETE_TASK: payload has { "taskId": string }
4. FOCUS_TASK: payload has { "taskId": string }

For COMPLETE_TASK, DELETE_TASK, or FOCUS_TASK, find the matching taskId from the user's task list provided above.

You MUST respond in JSON format with two keys:
1. "message": "Your text response to the user. Explain what actions you did or answer their question. Keep it concise, friendly, and use markdown where helpful."
2. "actions": A list of actions as defined above.

Example JSON output:
{
  "message": "I've added 'Buy groceries' for you.",
  "actions": [
    { "type": "ADD_TASK", "payload": { "title": "Buy groceries", "priority": "Medium", "dueDate": null } }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'http://localhost:8081',
        'X-Title': 'DailyTask App'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userMessage }
        ],
        response_format: {
          type: 'json_object'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const resData = await response.json();
    const responseJsonStr = resData.choices?.[0]?.message?.content;
    if (!responseJsonStr) {
      throw new Error('Empty response from OpenRouter API');
    }

    return JSON.parse(responseJsonStr) as AIResponse;
  }
}
