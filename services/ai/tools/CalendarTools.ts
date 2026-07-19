import { CalendarService } from '../../CalendarService';
import { TaskRepository } from '../../../repository/TaskRepository';
import { ToolRegistry } from '../ToolRegistry';
import { ToolResult } from '../types';

export function registerCalendarTools() {
  ToolRegistry.register({
    name: 'get_calendar_events',
    description: 'Retrieves calendar scheduled tasks for a given date',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'ISO date string or YYYY-MM-DD' },
      },
    },
    execute: async (args): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const targetDate = args.date ? new Date(args.date) : new Date();
      const dateStr = CalendarService.formatDate(targetDate);
      const dayTasks = CalendarService.getTasksForDate(all, dateStr);
      return { success: true, data: { date: dateStr, tasks: dayTasks } };
    },
  });

  ToolRegistry.register({
    name: 'get_upcoming_deadlines',
    description: 'Gets tasks due in the next N days',
    category: 'calendar',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of upcoming days to check' },
      },
    },
    execute: async (args): Promise<ToolResult> => {
      const days = args.days || 7;
      const all = await TaskRepository.getAllTasks();
      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const upcoming = all.filter(
        (t) =>
          !t.completed &&
          !t.deleted &&
          !t.archived &&
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= future
      );

      return { success: true, data: upcoming };
    },
  });
}
