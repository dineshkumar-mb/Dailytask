import { ToolRegistry } from '../ToolRegistry';
import { ToolResult } from '../types';

export function registerFocusTools() {
  ToolRegistry.register({
    name: 'start_focus_session',
    description: 'Triggers a focus session for a task',
    category: 'focus',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
      },
      required: ['taskId'],
    },
    execute: async (args): Promise<ToolResult> => {
      return {
        success: true,
        action: { type: 'FOCUS_TASK', payload: { taskId: args.taskId } },
      };
    },
  });
}
