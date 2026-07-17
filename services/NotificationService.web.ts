/**
 * NotificationService — Web stub.
 *
 * Metro resolves this file on web builds instead of NotificationService.native.ts.
 * All methods are pure no-ops so the web bundle never imports expo-notifications.
 * The API surface is identical so all callers compile without changes.
 */

import { Task } from '../types/task';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'web';

// No-op: notification handler setup is not needed on web
export function setNotificationHandler(): void {}

export class NotificationService {
  static readonly MORNING_NOTIFICATION_ID = 'daily-morning-planner';
  static readonly EVENING_NOTIFICATION_ID = 'daily-evening-review';

  static async requestPermissions(): Promise<PermissionStatus> {
    return 'web';
  }

  static async scheduleTaskReminder(
    _task: Task,
    _offsetMinutes: number
  ): Promise<string | null> {
    return null;
  }

  static async cancelTaskReminders(_taskId: string): Promise<void> {}

  static async rescheduleTaskReminders(
    _task: Task,
    _offsetMinutes: number
  ): Promise<void> {}

  static async notifyFocusComplete(
    _sessionType: 'focus' | 'short_break' | 'long_break',
    _taskTitle?: string
  ): Promise<void> {}

  static async scheduleMorningPlanner(_hour: number, _minute: number): Promise<void> {}

  static async cancelMorningPlanner(): Promise<void> {}

  static async scheduleEveningReview(_hour: number, _minute: number): Promise<void> {}

  static async cancelEveningReview(): Promise<void> {}

  static addTapListener(
    _onTaskNotification: (taskId: string) => void,
    _onFocusNotification: () => void
  ): (() => void) | null {
    return null;
  }
}
