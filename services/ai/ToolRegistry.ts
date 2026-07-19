import { ToolDefinition, ToolResult } from './types';
import { Logger } from '../Logger';

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    Logger.info(`[ToolRegistry] Registered tool: ${tool.name} [${tool.category}]`);
  }

  static getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static has(name: string): boolean {
    return this.tools.has(name);
  }

  static async execute(
    name: string,
    args: Record<string, any>,
    context?: any
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      Logger.error(`[ToolRegistry] Attempted to execute unregistered tool: ${name}`);
      return { success: false, error: `Tool "${name}" is not registered.` };
    }

    try {
      Logger.info(`[ToolRegistry] Executing tool "${name}" with args:`, args);
      return await tool.execute(args, context);
    } catch (error: any) {
      Logger.error(`[ToolRegistry] Execution error in tool "${name}"`, error);
      return { success: false, error: error?.message || 'Tool execution failed.' };
    }
  }

  static clear(): void {
    this.tools.clear();
  }
}
