import { AIMemoryService } from '../AIMemoryService';
import { ToolRegistry } from '../ToolRegistry';
import { MemoryType, ToolResult } from '../types';

export function registerMemoryTools() {
  ToolRegistry.register({
    name: 'remember_fact',
    description: 'Saves a key fact, preference, goal, or routine into long-term memory',
    category: 'memory',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Fact or preference text to store' },
        type: {
          type: 'string',
          enum: [
            'preference',
            'goal',
            'routine',
            'constraint',
            'fact',
            'decision',
            'project',
            'relationship',
          ],
          description: 'Type of memory',
        },
      },
      required: ['content'],
    },
    execute: async (args, context): Promise<ToolResult> => {
      const memory = await AIMemoryService.rememberFact(
        args.content,
        (args.type as MemoryType) || 'fact',
        context?.apiKey
      );
      if (!memory) {
        return { success: false, error: 'Memory was rejected as duplicate or invalid.' };
      }
      return { success: true, data: memory };
    },
  });

  ToolRegistry.register({
    name: 'get_memories',
    description: 'Retrieves stored long-term memories',
    category: 'memory',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      const memories = await AIMemoryService.getAll();
      return { success: true, data: memories };
    },
  });

  ToolRegistry.register({
    name: 'forget_fact',
    description: 'Deletes a long-term memory by ID',
    category: 'memory',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Memory ID' },
      },
      required: ['id'],
    },
    execute: async (args): Promise<ToolResult> => {
      await AIMemoryService.delete(args.id);
      return { success: true, data: { deletedId: args.id } };
    },
  });
}
