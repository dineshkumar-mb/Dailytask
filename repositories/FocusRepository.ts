import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client';
import { focusSessions } from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export interface FocusSessionRecord {
  id: string;
  taskId: string | null;
  type: 'focus' | 'short_break' | 'long_break';
  plannedSeconds: number;
  actualSeconds: number;
  status: 'completed' | 'interrupted' | 'cancelled';
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class FocusRepository {
  static async create(session: Partial<FocusSessionRecord>): Promise<string> {
    const id = session.id || uuidv4();
    const now = new Date();
    
    await db.insert(focusSessions).values({
      id,
      taskId: session.taskId || null,
      type: session.type || 'focus',
      plannedSeconds: session.plannedSeconds || 0,
      actualSeconds: session.actualSeconds || 0,
      status: session.status || 'cancelled',
      startedAt: session.startedAt || null,
      endedAt: session.endedAt || null,
      createdAt: now,
      updatedAt: now,
    });
    
    return id;
  }

  static async update(id: string, updates: Partial<FocusSessionRecord>): Promise<void> {
    const now = new Date();
    
    await db.update(focusSessions)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(focusSessions.id, id));
  }

  static async getById(id: string): Promise<FocusSessionRecord | undefined> {
    const result = await db.select().from(focusSessions).where(eq(focusSessions.id, id));
    return result[0] as FocusSessionRecord | undefined;
  }

  static async getRecentSessions(limit: number = 20): Promise<FocusSessionRecord[]> {
    return await db.select()
      .from(focusSessions)
      .orderBy(desc(focusSessions.createdAt))
      .limit(limit) as FocusSessionRecord[];
  }
  
  static async getSessionsSince(date: Date): Promise<FocusSessionRecord[]> {
    return await db.select()
      .from(focusSessions)
      .where(gte(focusSessions.createdAt, date))
      .orderBy(desc(focusSessions.createdAt)) as FocusSessionRecord[];
  }
}
