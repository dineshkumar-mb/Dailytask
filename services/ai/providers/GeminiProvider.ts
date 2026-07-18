import { AIProvider, AIResponse } from '../types';

export class GeminiProvider implements AIProvider {
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

Return a JSON object conforming exactly to this schema:
{
  "message": "Your text response to the user. Explain what actions you did or answer their question. Keep it concise, friendly, and use markdown where helpful.",
  "actions": [
    { "type": "ADD_TASK" | "COMPLETE_TASK" | "DELETE_TASK" | "FOCUS_TASK", "payload": { ... } }
  ]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              message: { type: 'STRING' },
              actions: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    type: { type: 'STRING', enum: ['ADD_TASK', 'COMPLETE_TASK', 'DELETE_TASK', 'FOCUS_TASK'] },
                    payload: {
                      type: 'OBJECT',
                      properties: {
                        title: { type: 'STRING' },
                        priority: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                        dueDate: { type: 'STRING' },
                        taskId: { type: 'STRING' }
                      }
                    }
                  },
                  required: ['type']
                }
              }
            },
            required: ['message']
          }
        }
      })
    });

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
}
