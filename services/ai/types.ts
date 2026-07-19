import { Task } from '../../types/task';

export type MemoryType =
  | 'preference'
  | 'goal'
  | 'routine'
  | 'constraint'
  | 'fact'
  | 'decision'
  | 'project'
  | 'relationship';

export interface AIMemory {
  id: string;
  content: string;
  type: MemoryType;
  importance: number;
  accessCount: number;
  lastAccessedAt?: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
}

export interface StoredVector {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export type AIActionType = 'ADD_TASK' | 'COMPLETE_TASK' | 'DELETE_TASK' | 'FOCUS_TASK';

export interface AIAction {
  type: AIActionType;
  payload: {
    title?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate?: string | null;
    taskId?: string;
    description?: string;
    category?: string;
  };
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'ai' | 'system';
  text: string;
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
  toolCallsExecuted?: string[];
  usedMemory?: boolean;
  fromCache?: boolean;
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  action?: AIAction;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<ToolResult>;
  requiresConfirmation?: boolean;
  category: 'task' | 'memory' | 'calendar' | 'focus' | 'analytics';
}

export interface ProviderCapabilities {
  supportsToolCalling: boolean;
  supportsEmbeddings: boolean;
  maxTokens: number;
  isOnline: boolean;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMResponse {
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse>;
}
