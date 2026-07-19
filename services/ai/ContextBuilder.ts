import { Task } from '../../types/task';
import { SYSTEM_PROMPT_TEMPLATE } from './prompts/system';
import { AIMemory, ChatMessage } from './types';

export interface ContextPayload {
  userMessage: string;
  retrievedTasks: Task[];
  memories: AIMemory[];
  chatHistory?: ChatMessage[];
  todaySummary?: {
    completedTodayCount: number;
    todayTasksCount: number;
    overdueTasksCount: number;
  };
}

export class ContextBuilder {
  /**
   * Assembles a structured system prompt using retrieved context and enforces token budget limits.
   */
  static buildSystemPrompt(payload: ContextPayload): string {
    const nowStr = new Date().toLocaleString();

    // 1. Memories section
    let memoriesSection = '';
    if (payload.memories && payload.memories.length > 0) {
      const memoryLines = payload.memories
        .map((m) => `• [${m.type.toUpperCase()}] ${m.content}`)
        .join('\n');
      memoriesSection = `Long-Term User Memories & Preferences:\n${memoryLines}`;
    }

    // 2. Tasks section
    let tasksSection = '';
    if (payload.retrievedTasks && payload.retrievedTasks.length > 0) {
      const taskLines = payload.retrievedTasks
        .map((t) => {
          const dueStr = t.dueDate ? ` | Due: ${new Date(t.dueDate).toISOString().split('T')[0]}` : '';
          const statusStr = t.completed ? '[Completed]' : '[Active]';
          return `• ID: "${t.id}" | ${statusStr} "${t.title}" | Priority: ${t.priority}${dueStr}`;
        })
        .join('\n');
      tasksSection = `Relevant Tasks Context:\n${taskLines}`;
    }

    // 3. Today metrics section
    let metricsSection = '';
    if (payload.todaySummary) {
      const s = payload.todaySummary;
      metricsSection = `Today's Overview:\n• Completed today: ${s.completedTodayCount}\n• Tasks due today: ${s.todayTasksCount}\n• Overdue tasks: ${s.overdueTasksCount}`;
    }

    // Replace placeholders in system prompt template
    let systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{{CURRENT_DATE_TIME}}', nowStr)
      .replace('{{MEMORIES_SECTION}}', memoriesSection)
      .replace('{{TASKS_SECTION}}', tasksSection)
      .replace('{{TODAY_METRICS_SECTION}}', metricsSection);

    // Enforce token budget (max ~2000 words / ~8000 chars)
    if (systemPrompt.length > 8000) {
      systemPrompt = systemPrompt.substring(0, 8000) + '\n[Context truncated due to size limits]';
    }

    return systemPrompt;
  }
}
