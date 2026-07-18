import { TaskRepository } from '../repository/TaskRepository';
import { Task } from '../types/task';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './NotificationService';
import { useSettingsStore } from '../store/settingsStore';
import { EventBus } from './EventBus';
import { Logger } from './Logger';

export class TaskService {
  /**
   * Initializes a new task with proper metadata and persists it.
   * Schedules a local notification if the task has a dueDate and reminders are enabled.
   * Publishes TASK_CREATED domain event on success.
   */
  static async createTask(data: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      ...data,
      id: uuidv4(),
      title: data.title || 'Untitled Task',
      priority: data.priority || 'Medium',
      completed: false,
      archived: false,
      deleted: false,
      subtasks: data.subtasks || [],
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;

    try {
      await TaskRepository.addTask(newTask);
      Logger.info(`[TaskService] Task created: "${newTask.title}" (id: ${newTask.id})`);
    } catch (error) {
      Logger.error(`[TaskService] Failed to persist new task: "${newTask.title}"`, error);
      throw error;
    }

    // Schedule notification if dueDate is set and prefs allow it
    const prefs = useSettingsStore.getState().notifications;
    if (newTask.dueDate && prefs.taskRemindersEnabled) {
      try {
        await NotificationService.scheduleTaskReminder(newTask, prefs.reminderOffsetMinutes);
      } catch (notifError) {
        Logger.warn(`[TaskService] Failed to schedule notification for task: ${newTask.id}`, notifError);
        // Non-fatal: task was persisted, notification is best-effort
      }
    }

    EventBus.publish('TASK_CREATED', newTask);
    return newTask;
  }

  /**
   * Toggles task completion status.
   * Cancels all pending notifications when marking complete.
   * Publishes TASK_COMPLETED domain event on success.
   */
  static async toggleTaskCompletion(task: Task): Promise<Task> {
    const isNowCompleted = !task.completed;
    const updates: Partial<Task> = {
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : undefined,
    };

    try {
      await TaskRepository.updateTask(task.id, updates);
      Logger.info(`[TaskService] Task ${isNowCompleted ? 'completed' : 'un-completed'}: "${task.title}" (id: ${task.id})`);
    } catch (error) {
      Logger.error(`[TaskService] Failed to toggle completion for task: ${task.id}`, error);
      throw error;
    }

    // Cancel reminders when task is completed
    if (isNowCompleted) {
      try {
        await NotificationService.cancelTaskReminders(task.id);
      } catch (notifError) {
        Logger.warn(`[TaskService] Failed to cancel notifications for task: ${task.id}`, notifError);
      }
    }

    const updatedTask = { ...task, ...updates };
    EventBus.publish('TASK_COMPLETED', { id: task.id, completed: isNowCompleted, task: updatedTask });
    return updatedTask;
  }

  /**
   * Archives a task and cancels its notifications.
   * Publishes TASK_UPDATED domain event on success.
   */
  static async archiveTask(task: Task): Promise<Task> {
    const updates = { archived: true };
    try {
      await TaskRepository.updateTask(task.id, updates);
      await NotificationService.cancelTaskReminders(task.id);
      Logger.info(`[TaskService] Task archived: "${task.title}" (id: ${task.id})`);
    } catch (error) {
      Logger.error(`[TaskService] Failed to archive task: ${task.id}`, error);
      throw error;
    }
    const updatedTask = { ...task, ...updates };
    EventBus.publish('TASK_UPDATED', { id: task.id, data: updates });
    return updatedTask;
  }

  /**
   * Soft-deletes a task and cancels its notifications.
   * Publishes TASK_DELETED domain event on success.
   */
  static async softDeleteTask(task: Task): Promise<Task> {
    const updates = { deleted: true, archived: false };
    try {
      await TaskRepository.updateTask(task.id, updates);
      await NotificationService.cancelTaskReminders(task.id);
      Logger.info(`[TaskService] Task soft-deleted: "${task.title}" (id: ${task.id})`);
    } catch (error) {
      Logger.error(`[TaskService] Failed to soft-delete task: ${task.id}`, error);
      throw error;
    }
    const updatedTask = { ...task, ...updates };
    EventBus.publish('TASK_DELETED', task.id);
    return updatedTask;
  }

  /**
   * Updates general task properties.
   * Reschedules notifications if dueDate or reminderDate changed.
   * Publishes TASK_UPDATED domain event on success.
   */
  static async updateTaskProperties(id: string, updates: Partial<Task>, originalTask?: Task): Promise<void> {
    try {
      await TaskRepository.updateTask(id, updates);
      Logger.info(`[TaskService] Task updated (id: ${id})`, { fields: Object.keys(updates) });
    } catch (error) {
      Logger.error(`[TaskService] Failed to update task properties for id: ${id}`, error);
      throw error;
    }

    // Reschedule if schedule-relevant fields changed
    const scheduleChanged =
      'dueDate' in updates || 'reminderDate' in updates || 'deleted' in updates;

    if (scheduleChanged && originalTask) {
      const updatedTask = { ...originalTask, ...updates };
      const prefs = useSettingsStore.getState().notifications;

      try {
        if (updatedTask.deleted || updatedTask.archived || updatedTask.completed) {
          await NotificationService.cancelTaskReminders(id);
        } else if (updatedTask.dueDate && prefs.taskRemindersEnabled) {
          await NotificationService.rescheduleTaskReminders(updatedTask as Task, prefs.reminderOffsetMinutes);
        }
      } catch (notifError) {
        Logger.warn(`[TaskService] Failed to reschedule notifications for task: ${id}`, notifError);
      }
    }

    EventBus.publish('TASK_UPDATED', { id, data: updates });
  }
}
