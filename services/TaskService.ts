import { TaskRepository } from '../repository/TaskRepository';
import { Task } from '../types/task';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './NotificationService';
import { useSettingsStore } from '../store/settingsStore';

export class TaskService {
  /**
   * Initializes a new task with proper metadata and persists it.
   * If the task has a reminderDate, schedules a local notification.
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

    await TaskRepository.addTask(newTask);

    // Schedule notification if reminderDate is set and prefs allow it
    const prefs = useSettingsStore.getState().notifications;
    if (newTask.dueDate && prefs.taskRemindersEnabled) {
      await NotificationService.scheduleTaskReminder(newTask, prefs.reminderOffsetMinutes);
    }

    return newTask;
  }

  /**
   * Toggles task completion status.
   * Cancels all pending notifications when marking complete.
   */
  static async toggleTaskCompletion(task: Task): Promise<Task> {
    const isNowCompleted = !task.completed;
    const updates: Partial<Task> = {
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : undefined,
    };

    await TaskRepository.updateTask(task.id, updates);

    // Cancel reminders when task is completed
    if (isNowCompleted) {
      await NotificationService.cancelTaskReminders(task.id);
    }

    return { ...task, ...updates };
  }

  /**
   * Archives a task and cancels its notifications.
   */
  static async archiveTask(task: Task): Promise<Task> {
    const updates = { archived: true };
    await TaskRepository.updateTask(task.id, updates);
    await NotificationService.cancelTaskReminders(task.id);
    return { ...task, ...updates };
  }

  /**
   * Soft-deletes a task and cancels its notifications.
   */
  static async softDeleteTask(task: Task): Promise<Task> {
    const updates = { deleted: true, archived: false };
    await TaskRepository.updateTask(task.id, updates);
    await NotificationService.cancelTaskReminders(task.id);
    return { ...task, ...updates };
  }

  /**
   * Updates general task properties.
   * Reschedules notifications if dueDate or reminderDate changed.
   */
  static async updateTaskProperties(id: string, updates: Partial<Task>, originalTask?: Task): Promise<void> {
    await TaskRepository.updateTask(id, updates);

    // Reschedule if schedule-relevant fields changed
    const scheduleChanged =
      'dueDate' in updates || 'reminderDate' in updates || 'deleted' in updates;

    if (scheduleChanged && originalTask) {
      const updatedTask = { ...originalTask, ...updates };
      const prefs = useSettingsStore.getState().notifications;

      if (updatedTask.deleted || updatedTask.archived || updatedTask.completed) {
        await NotificationService.cancelTaskReminders(id);
      } else if (updatedTask.dueDate && prefs.taskRemindersEnabled) {
        await NotificationService.rescheduleTaskReminders(updatedTask as Task, prefs.reminderOffsetMinutes);
      }
    }
  }
}
