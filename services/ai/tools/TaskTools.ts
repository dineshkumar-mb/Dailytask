import { TaskService } from '../../TaskService';
import { TaskRepository } from '../../../repository/TaskRepository';
import { ToolRegistry } from '../ToolRegistry';
import { ToolResult } from '../types';
import { DashboardService } from '../../DashboardService';

export function registerTaskTools() {
  ToolRegistry.register({
    name: 'search_tasks',
    description: 'Search tasks by keyword or category',
    category: 'task',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or title' },
      },
      required: ['query'],
    },
    execute: async (args): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const q = (args.query || '').toLowerCase();
      const matches = all.filter(
        (t) =>
          !t.deleted &&
          (t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.category && t.category.toLowerCase().includes(q)))
      );
      return { success: true, data: matches };
    },
  });

  ToolRegistry.register({
    name: 'create_task',
    description: 'Creates a new task in DailyTask',
    category: 'task',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'], description: 'Priority' },
        dueDate: { type: 'string', description: 'ISO date string or null' },
        category: { type: 'string', description: 'Category name (Work, Personal, etc)' },
        description: { type: 'string', description: 'Description or details' },
      },
      required: ['title'],
    },
    execute: async (args): Promise<ToolResult> => {
      const task = await TaskService.createTask({
        title: args.title,
        priority: args.priority || 'Medium',
        dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
        category: args.category,
        description: args.description,
      });
      return {
        success: true,
        data: task,
        action: { type: 'ADD_TASK', payload: { title: task.title, priority: task.priority } },
      };
    },
  });

  ToolRegistry.register({
    name: 'complete_task',
    description: 'Marks a task as completed by taskId',
    category: 'task',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'UUID of the task' },
      },
      required: ['taskId'],
    },
    execute: async (args): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const task = all.find((t) => t.id === args.taskId);
      if (!task) return { success: false, error: 'Task not found' };

      const updated = await TaskService.toggleTaskCompletion(task);
      return {
        success: true,
        data: updated,
        action: { type: 'COMPLETE_TASK', payload: { taskId: task.id } },
      };
    },
  });

  ToolRegistry.register({
    name: 'delete_task',
    description: 'Soft-deletes a task by taskId (requires confirmation)',
    category: 'task',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'UUID of the task' },
      },
      required: ['taskId'],
    },
    execute: async (args): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const task = all.find((t) => t.id === args.taskId);
      if (!task) return { success: false, error: 'Task not found' };

      const updated = await TaskService.softDeleteTask(task);
      return {
        success: true,
        data: updated,
        action: { type: 'DELETE_TASK', payload: { taskId: task.id } },
      };
    },
  });

  ToolRegistry.register({
    name: 'focus_task',
    description: 'Selects a task for a Pomodoro focus session',
    category: 'task',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'UUID of the task' },
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

  ToolRegistry.register({
    name: 'get_today_summary',
    description: 'Computes metrics and summary for today tasks',
    category: 'task',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const metrics = DashboardService.computeMetrics(all);
      return { success: true, data: metrics };
    },
  });
}
