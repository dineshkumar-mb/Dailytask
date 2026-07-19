import { TaskRepository } from '../../../repository/TaskRepository';
import { DashboardService } from '../../DashboardService';
import { ToolRegistry } from '../ToolRegistry';
import { ToolResult } from '../types';

export function registerAnalyticsTools() {
  ToolRegistry.register({
    name: 'get_productivity_stats',
    description: 'Calculates productivity completion rate and active task metrics',
    category: 'analytics',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      const all = await TaskRepository.getAllTasks();
      const metrics = DashboardService.computeMetrics(all);
      const total = all.filter((t) => !t.deleted).length;
      const completed = all.filter((t) => t.completed && !t.deleted).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        success: true,
        data: {
          metrics,
          totalTasks: total,
          completedTasks: completed,
          completionRatePercent: completionRate,
        },
      };
    },
  });
}
