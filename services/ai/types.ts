export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export type AIActionType = 'ADD_TASK' | 'COMPLETE_TASK' | 'DELETE_TASK' | 'FOCUS_TASK';

export interface AIAction {
  type: AIActionType;
  payload: {
    title?: string;
    priority?: 'Low' | 'Medium' | 'High';
    dueDate?: string | null;
    taskId?: string;
  };
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
}

export interface AIProvider {
  processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse>;
}
