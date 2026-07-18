/**
 * NotificationService — Native implementation (iOS + Android).
 *
 * Metro automatically resolves this file over NotificationService.ts
 * on native platforms. The .web.ts counterpart provides no-op stubs
 * so the web bundle never touches expo-notifications.
 */

let Notifications: any = {
  setNotificationHandler: () => {},
  getPermissionsAsync: async () => ({ status: 'denied' }),
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  scheduleNotificationAsync: async () => 'mock-id',
  cancelScheduledNotificationAsync: async () => {},
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily'
  }
};

try {
  const loadedNotifications = require('expo-notifications');
  if (loadedNotifications) {
    Notifications = loadedNotifications;
  }
} catch (error) {
  console.warn('[NotificationService] Failed to load native expo-notifications (falling back to mock):', error);
}

import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types/task';
import {
  NotificationRepository,
} from '../repositories/NotificationRepository';
import type { NotificationResponse } from 'expo-notifications';

// ─── Handler must be set at module level (before any scheduling) ───────────
export function setNotificationHandler() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('[NotificationService] Failed to set notification handler (likely running in Expo Go):', error);
  }
}

// ─── Permissions ────────────────────────────────────────────────────────────
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'web';

export class NotificationService {
  static async requestPermissions(): Promise<PermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'granted') return 'granted';

      const { status } = await Notifications.requestPermissionsAsync();
      return status as PermissionStatus;
    } catch (error) {
      console.warn('[NotificationService] Failed to request permissions (likely running in Expo Go):', error);
      return 'denied';
    }
  }

  // ─── Task Reminders ─────────────────────────────────────────────────────

  static async scheduleTaskReminder(
    task: Task,
    offsetMinutes: number
  ): Promise<string | null> {
    if (!task.dueDate) return null;

    const fireAt = new Date(new Date(task.dueDate).getTime() - offsetMinutes * 60 * 1000);
    if (fireAt <= new Date()) return null;

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

  static async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      const records = await NotificationRepository.cancelByTaskId(taskId);
      for (const record of records) {
        await Notifications.cancelScheduledNotificationAsync(record.id);
      }
    } catch (e) {
      console.warn('[NotificationService] Failed to cancel task reminders:', e);
    }
  }

  static async rescheduleTaskReminders(task: Task, offsetMinutes: number): Promise<void> {
    await NotificationService.cancelTaskReminders(task.id);
    await NotificationService.scheduleTaskReminder(task, offsetMinutes);
  }

  // ─── Focus / Break Notifications ────────────────────────────────────────

  static async notifyFocusComplete(
    sessionType: 'focus' | 'short_break' | 'long_break',
    taskTitle?: string
  ): Promise<void> {
    const messages: Record<typeof sessionType, { title: string; body: string }> = {
      focus: {
        title: '🎯 Focus session complete!',
        body: taskTitle ? `Great work on "${taskTitle}"` : 'Time for a well-earned break.',
      },
      short_break: { title: '☕ Break over!', body: 'Ready to focus again?' },
      long_break: { title: '🔋 Long break complete!', body: "You're recharged. Let's keep going!" },
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
    try {
      await Notifications.cancelScheduledNotificationAsync(NotificationService.MORNING_NOTIFICATION_ID);
    } catch {}
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
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.MORNING_NOTIFICATION_ID); } catch {}
  }

  static async scheduleEveningReview(hour: number, minute: number): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(NotificationService.EVENING_NOTIFICATION_ID);
    } catch {}
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
    try { await Notifications.cancelScheduledNotificationAsync(NotificationService.EVENING_NOTIFICATION_ID); } catch {}
  }

  // ─── Tap Listener ────────────────────────────────────────────────────────

  static addTapListener(
    onTaskNotification: (taskId: string) => void,
    onFocusNotification: () => void
  ): (() => void) | null {
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(
        (response: NotificationResponse) => {
          const data = response.notification.request.content.data as any;
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

      return () => {
        try {
          subscription.remove();
        } catch {}
      };
    } catch (e) {
      console.warn('[NotificationService] Failed to add notification tap listener (Expo Go fallback):', e);
      return null;
    }
  }
}
