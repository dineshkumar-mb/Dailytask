import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { tasks, subtasks } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { Task, Subtask } from '../types/task';

// Note: In a production app, we would use Drizzle's relational queries
// Since this is a lightweight repository, we'll implement basic CRUD

export class TaskRepository {
  /**
   * Fetch all tasks that are NOT permanently deleted
   */
  static async getAllTasks(): Promise<Task[]> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.deleted, false));
    const allSubtasks = await db.select().from(subtasks);
    
    // Stitch them together for the frontend
    // In Drizzle we could use `db.query.tasks.findMany({ with: { subtasks: true } })` 
    // if relations were defined, but doing it manually is fine for Phase 1
    
    return allTasks.map(t => {
      const taskSubtasks = allSubtasks.filter(st => st.taskId === t.id);
      
      return {
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        category: t.categoryId as any || undefined,
        priority: t.priority as any,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        reminderDate: t.reminderDate ? new Date(t.reminderDate) : undefined,
        estimatedMinutes: t.estimatedMinutes || undefined,
        actualMinutes: t.actualMinutes || undefined,
        recurrence: t.recurrenceFrequency ? {
          frequency: t.recurrenceFrequency as any,
          interval: t.recurrenceInterval || 1,
        } : undefined,
        subtasks: taskSubtasks.map(st => ({
          id: st.id,
          title: st.title,
          completed: st.completed,
          createdAt: new Date(st.createdAt),
          completedAt: st.completedAt ? new Date(st.completedAt) : undefined,
        })),
        notes: t.notes || undefined,
        attachments: [], // Implement attachments in Phase 2
        tags: [], // Implement tags in Phase 2
        completed: t.completed,
        archived: t.archived,
        deleted: t.deleted,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
      };
    });
  }

  /**
   * Create a new task and its initial subtasks
   */
  static async addTask(task: Task): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Insert Task
      await tx.insert(tasks).values({
        id: task.id,
        title: task.title,
        description: task.description || null,
        categoryId: task.category || null,
        priority: task.priority,
        dueDate: task.dueDate || null,
        reminderDate: task.reminderDate || null,
        estimatedMinutes: task.estimatedMinutes || null,
        actualMinutes: task.actualMinutes || null,
        recurrenceFrequency: task.recurrence?.frequency || null,
        recurrenceInterval: task.recurrence?.interval || null,
        notes: task.notes || null,
        completed: task.completed,
        archived: task.archived,
        deleted: task.deleted,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt || null,
      });
      
      // 2. Insert Subtasks
      if (task.subtasks && task.subtasks.length > 0) {
        const subtaskValues = task.subtasks.map(st => ({
          id: st.id,
          taskId: task.id,
          title: st.title,
          completed: st.completed,
          createdAt: st.createdAt,
          completedAt: st.completedAt || null,
        }));
        await tx.insert(subtasks).values(subtaskValues);
      }
    });
  }

  /**
   * Update a task's properties
   */
  static async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const updatePayload: any = {
      updatedAt: new Date(),
    };
    
    // Map Frontend Partial<Task> to DB Payload
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.categoryId = updates.category;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority;
    if (updates.dueDate !== undefined) updatePayload.dueDate = updates.dueDate;
    if (updates.reminderDate !== undefined) updatePayload.reminderDate = updates.reminderDate;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;
    if (updates.completed !== undefined) updatePayload.completed = updates.completed;
    if (updates.archived !== undefined) updatePayload.archived = updates.archived;
    if (updates.deleted !== undefined) updatePayload.deleted = updates.deleted;
    if (updates.completedAt !== undefined) updatePayload.completedAt = updates.completedAt;

    await db.transaction(async (tx) => {
      // 1. Update main task table if there are changes
      if (Object.keys(updatePayload).length > 1) { // > 1 because updatedAt is always there
        await tx.update(tasks).set(updatePayload).where(eq(tasks.id, id));
      }

      // 2. Overwrite Subtasks completely if they were provided in the update
      // (Optimized sync approach for simple apps: delete old subtasks, insert new ones)
      if (updates.subtasks !== undefined) {
        await tx.delete(subtasks).where(eq(subtasks.taskId, id));
        if (updates.subtasks.length > 0) {
          const subtaskValues = updates.subtasks.map(st => ({
            id: st.id,
            taskId: id,
            title: st.title,
            completed: st.completed,
            createdAt: st.createdAt,
            completedAt: st.completedAt || null,
          }));
          await tx.insert(subtasks).values(subtaskValues);
        }
      }
    });
  }

  /**
   * Permanently delete a task
   */
  static async permanentlyDeleteTask(id: string): Promise<void> {
    // Relying on ON DELETE CASCADE for subtasks/tags/attachments
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}
