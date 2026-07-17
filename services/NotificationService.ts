/**
 * NotificationService — the single point of contact with expo-notifications.
 *
 * No screen, store, or other service should import expo-notifications directly.
 * All scheduling, cancellation, and permission logic lives here.
 *
 * Web guard: expo-notifications is native-only. Every method that calls the
 * native API is wrapped with a Platform.OS !== 'web' check so the app
 * functions gracefully on web without errors.
 */

import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types/task';
import {
  NotificationRepository,
  NotificationType,
} from '../repositories/NotificationRepository';

// Lazy import — only resolved on native, never on web
let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
}

// ─── Handler must be set at module level (before any scheduling) ───────────
export function setNotificationHandler() {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Permissions ────────────────────────────────────────────────────────────
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'web';

export class NotificationService {
  static async requestPermissions(): Promise<PermissionStatus> {
    if (!Notifications) return 'web';

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return 'granted';

    const { status } = await Notifications.requestPermissionsAsync();
    return status as PermissionStatus;
  }

  // ─── Task Reminders ─────────────────────────────────────────────────────

  /**
   * Schedule one local notification `offsetMinutes` before task.dueDate.
   * Returns the expo-notifications identifier (also used as DB primary key).
   */
  static async scheduleTaskReminder(
    task: Task,
    offsetMinutes: number
  ): Promise<string | null> {
    if (!Notifications || !task.dueDate) return null;

    const fireAt = new Date(new Date(task.dueDate).getTime() - offsetMinutes * 60 * 1000);
    if (fireAt <= new Date()) return null; // Already in the past

    const id = uuidv4();
    const payload = {
      title: offsetMinutes === 0 ? '⏰ Task Due Now' : `⏰ Due in ${offsetMinutes} min`,
      body: task.title,
      data: { taskId: task.id, type: 'task_reminder' },
    };

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });

      // Persist to DB for audit / rescheduling
      await NotificationRepository.create({
        id,
        type: 'task_reminder',
        taskId: task.id,
        scheduledAt: fireAt,
        triggeredAt: null,
        status: 'scheduled',
        payload: JSON.stringify(payload),
      });

      return id;
    } catch (e) {
      console.warn('[NotificationService] Failed to schedule task reminder:', e);
      return null;
    }
  }

  /**
   * Cancel all scheduled reminders for a task (on completion, deletion, or edit).
   */
  static async cancelTaskReminders(taskId: string): Promise<void> {
    if (!Notifications) return;

    try {
      // Get scheduled records from DB so we know which native identifiers to cancel
      const records = await NotificationRepository.cancelByTaskId(taskId);
      for (const record of records) {
        await Notifications.cancelScheduledNotificationAsync(record.id);
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to cancel task reminders:', e);
    }
  }

  /**
   * Cancel existing reminders then re-schedule fresh ones.
   * Called when a task's dueDate or reminderDate changes.
   */
  static async rescheduleTaskReminders(
    task: Task,
    offsetMinutes: number
  ): Promise<void> {
    await NotificationService.cancelTaskReminders(task.id);
    await NotificationService.scheduleTaskReminder(task, offsetMinutes);
  }

  // ─── Focus / Break Notifications ────────────────────────────────────────

  /**
   * Fire an immediate notification when a focus session ends.
   * Uses a tiny delay (1s) so the session completion modal has time to appear first.
   */
  static async notifyFocusComplete(
    sessionType: 'focus' | 'short_break' | 'long_break',
    taskTitle?: string
  ): Promise<void> {
    if (!Notifications) return;

    const messages: Record<typeof sessionType, { title: string; body: string }> = {
      focus: {
        title: '🎯 Focus session complete!',
        body: taskTitle ? `Great work on "${taskTitle}"` : 'Time for a well-earned break.',
      },
      short_break: {
        title: '☕ Break over!',
        body: 'Ready to focus again?',
      },
      long_break: {
        title: '🔋 Long break complete!',
        body: 'You\'re recharged. Let\'s keep going!',
      },
    };

    const id = uuidv4();
    const { title, body } = messages[sessionType];

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title, body, data: { type: `${sessionType}_complete` }, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        },
      });

      await NotificationRepository.create({
        id,
        type: sessionType === 'focus' ? 'focus_complete' : 'break_complete',
        taskId: null,
        scheduledAt: new Date(),
        triggeredAt: null,
        status: 'scheduled',
        payload: JSON.stringify({ title, body }),
      });
    } catch (e) {
      console.warn('[NotificationService] Failed to schedule focus notification:', e);
    }
  }

  // ─── Daily Reminders ────────────────────────────────────────────────────

  static readonly MORNING_NOTIFICATION_ID = 'daily-morning-planner';
  static readonly EVENING_NOTIFICATION_ID = 'daily-evening-review';

  static async scheduleMorningPlanner(hour: number, minute: number): Promise<void> {
    if (!Notifications) return;
    // Cancel existing first
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.MORNING_NOTIFICATION_ID); } catch {}

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: NotificationService.MORNING_NOTIFICATION_ID,
        content: {
          title: '🌅 Good morning!',
          body: 'Plan your day — what will you focus on today?',
          data: { type: 'daily_plan' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
        } as any,
      });
    } catch (e) {
      console.warn('[NotificationService] Failed to schedule morning planner:', e);
    }
  }

  static async cancelMorningPlanner(): Promise<void> {
    if (!Notifications) return;
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.MORNING_NOTIFICATION_ID); } catch {}
  }

  static async scheduleEveningReview(hour: number, minute: number): Promise<void> {
    if (!Notifications) return;
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.EVENING_NOTIFICATION_ID); } catch {}

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: NotificationService.EVENING_NOTIFICATION_ID,
        content: {
          title: '🌙 Evening review',
          body: 'How did today go? Review your progress.',
          data: { type: 'daily_review' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
        } as any,
      });
    } catch (e) {
      console.warn('[NotificationService] Failed to schedule evening review:', e);
    }
  }

  static async cancelEveningReview(): Promise<void> {
    if (!Notifications) return;
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.EVENING_NOTIFICATION_ID); } catch {}
  }

  // ─── Tap Handler ────────────────────────────────────────────────────────

  /**
   * Call in _layout.tsx to handle notification taps and route accordingly.
   * Returns the subscription — caller must call .remove() on unmount.
   */
  static addTapListener(
    onTaskNotification: (taskId: string) => void,
    onFocusNotification: () => void
  ): (() => void) | null {
    if (!Notifications) return null;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: import('expo-notifications').NotificationResponse) => {
        const data = response.notification.request.content.data as any;
        // Mark as triggered in DB
        NotificationRepository.updateStatus(
          response.notification.request.identifier,
          'triggered',
          new Date()
        ).catch(() => {});

        if (data?.taskId) {
          onTaskNotification(data.taskId);
        } else {
          onFocusNotification();
        }
      }
    );

    return () => subscription.remove();
  }
}
