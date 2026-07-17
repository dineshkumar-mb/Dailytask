import { TaskRepository } from '../repository/TaskRepository';
import { Task } from '../types/task';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  /**
   * Initializes a new task with proper metadata and persists it
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
    
    // In Phase 3, we would schedule local notifications here if reminderDate exists
    
    return newTask;
  }

  /**
   * Toggles task completion status
   */
  static async toggleTaskCompletion(task: Task): Promise<Task> {
    const isNowCompleted = !task.completed;
    const updates: Partial<Task> = {
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : undefined,
    };
    
    await TaskRepository.updateTask(task.id, updates);
    return { ...task, ...updates };
  }

  /**
   * Archives a task
   */
  static async archiveTask(task: Task): Promise<Task> {
    const updates = { archived: true };
    await TaskRepository.updateTask(task.id, updates);
    return { ...task, ...updates };
  }

  /**
   * Soft-deletes a task
   */
  static async softDeleteTask(task: Task): Promise<Task> {
    const updates = { deleted: true, archived: false };
    await TaskRepository.updateTask(task.id, updates);
    return { ...task, ...updates };
  }

  /**
   * Updates general task properties
   */
  static async updateTaskProperties(id: string, updates: Partial<Task>): Promise<void> {
    // Validate business rules here if needed
    await TaskRepository.updateTask(id, updates);
  }
}
