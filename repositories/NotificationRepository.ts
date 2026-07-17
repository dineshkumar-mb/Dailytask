import { db } from '../db/client';
import { notifications } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type NotificationType =
  | 'task_reminder'
  | 'focus_complete'
  | 'break_complete'
  | 'daily_plan'
  | 'daily_review'
  | 'weekly_summary';

export type NotificationStatus = 'scheduled' | 'triggered' | 'cancelled';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  taskId: string | null;
  scheduledAt: Date | null;
  triggeredAt: Date | null;
  status: NotificationStatus;
  payload: string | null; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationRepository {
  static async create(record: Omit<NotificationRecord, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date();
    await db.insert(notifications).values({
      id: record.id,
      type: record.type,
      taskId: record.taskId ?? null,
      scheduledAt: record.scheduledAt ?? null,
      triggeredAt: null,
      status: record.status,
      payload: record.payload ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async updateStatus(
    id: string,
    status: NotificationStatus,
    triggeredAt?: Date
  ): Promise<void> {
    const now = new Date();
    await db
      .update(notifications)
      .set({ status, triggeredAt: triggeredAt ?? null, updatedAt: now })
      .where(eq(notifications.id, id));
  }

  static async cancelByTaskId(taskId: string): Promise<NotificationRecord[]> {
    const now = new Date();
    const scheduled = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.taskId, taskId), eq(notifications.status, 'scheduled'))
      ) as NotificationRecord[];

    if (scheduled.length > 0) {
      await db
        .update(notifications)
        .set({ status: 'cancelled', updatedAt: now })
        .where(and(eq(notifications.taskId, taskId), eq(notifications.status, 'scheduled')));
    }

    return scheduled; // Return so caller can cancel native identifiers
  }

  static async getByTaskId(taskId: string): Promise<NotificationRecord[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.taskId, taskId)) as NotificationRecord[];
  }

  static async getPending(): Promise<NotificationRecord[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, 'scheduled')) as NotificationRecord[];
  }
}
