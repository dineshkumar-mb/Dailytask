import { Task } from '../types/task';
import { CalendarService } from './CalendarService';

export interface WeeklyStat {
  date: string;
  dayName: string;
  completedCount: number;
}

export interface DashboardMetrics {
  todayTasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
  completedTodayCount: number;
  weeklyStats: WeeklyStat[];
  productivityScore: number;
  streak: number;
  completionPercentage: number;
}

export class DashboardService {
  /**
   * Generates a localized greeting based on the current hour.
   */
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /**
   * Primary method to compute all dashboard metrics from the task store.
   * This ensures aggregation runs once and caches the result for the UI.
   */
  static computeMetrics(tasks: Task[]): DashboardMetrics {
    const now = new Date();
    const todayStr = CalendarService.formatDate(now);
    
    // Normalize today to start of day for accurate comparison
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Active, unarchived, non-deleted tasks
    const activeTasks = tasks.filter(t => !t.deleted && !t.archived);

    // Grouping
    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    const overdueTasks: Task[] = [];
    let completedTodayCount = 0;

    activeTasks.forEach(task => {
      if (task.completed) {
        // Check if completed today
        if (task.completedAt) {
          const completedDateStr = CalendarService.formatDate(new Date(task.completedAt));
          if (completedDateStr === todayStr) {
            completedTodayCount++;
          }
        } else {
          // Fallback if completedAt wasn't set reliably
          const updatedStr = CalendarService.formatDate(new Date(task.updatedAt));
          if (updatedStr === todayStr) {
            completedTodayCount++;
          }
        }
        return;
      }

      // If not completed, evaluate due date
      if (!task.dueDate) return; // Unscheduled tasks are not counted in these buckets

      const taskDate = new Date(task.dueDate);
      const taskDateStr = CalendarService.formatDate(taskDate);
      const startOfTaskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()).getTime();

      if (taskDateStr === todayStr) {
        todayTasks.push(task);
      } else if (startOfTaskDate < startOfToday) {
        overdueTasks.push(task);
      } else if (startOfTaskDate > startOfToday) {
        upcomingTasks.push(task);
      }
    });

    // 2. Weekly Productivity (Last 7 days)
    const weeklyStats: WeeklyStat[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dStr = CalendarService.formatDate(d);
      
      const completedOnDay = activeTasks.filter(t => {
        if (!t.completed) return false;
        const cDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
        return CalendarService.formatDate(cDate) === dStr;
      }).length;

      weeklyStats.push({
        date: dStr,
        dayName: dayNames[d.getDay()],
        completedCount: completedOnDay
      });
    }

    // 3. Current Streak (Consecutive days with at least 1 completed task)
    let streak = 0;
    // Iterate backwards from today. If today has 0, check yesterday. If yesterday has 0, streak is 0.
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Determine if we should start counting from today or yesterday (if today is 0 but streak is active from yesterday)
    let todayCount = activeTasks.filter(t => t.completed && CalendarService.formatDate(t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)) === CalendarService.formatDate(checkDate)).length;
    
    if (todayCount === 0) {
      // Check yesterday to see if streak is still alive
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const targetStr = CalendarService.formatDate(checkDate);
      const count = activeTasks.filter(t => t.completed && CalendarService.formatDate(t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)) === targetStr).length;
      
      if (count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // move back 1 day
      } else {
        break; // Streak broken
      }
    }

    // 4. Productivity Score
    const totalTodayItems = todayTasks.length + completedTodayCount;
    let completionPercentage = 0;
    if (totalTodayItems > 0) {
      completionPercentage = Math.round((completedTodayCount / totalTodayItems) * 100);
    }

    // Compute KPI: Score out of 100 (can go slightly above with bonuses)
    const overduePenalty = overdueTasks.length * 5; // -5 points per overdue task
    const streakBonus = Math.min(streak * 2, 20); // +2 points per streak day, max 20

    let productivityScore = completionPercentage - overduePenalty + streakBonus;
    productivityScore = Math.max(0, Math.min(100, productivityScore)); // Clamp between 0-100

    return {
      todayTasks,
      upcomingTasks,
      overdueTasks,
      completedTodayCount,
      weeklyStats,
      productivityScore,
      streak,
      completionPercentage,
    };
  }
}
