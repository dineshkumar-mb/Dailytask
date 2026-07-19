import { create } from 'zustand';
import { Task, TaskCategoryType } from '../types/task';
import { TaskService } from '../services/TaskService';
import { TaskRepository } from '../repository/TaskRepository';
import { AIService } from '../services/ai/AIService';
import { Logger } from '../services/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';


export type FilterType = 'All' | 'Active' | 'Completed';
export type SortType = 'Newest' | 'Priority' | 'Alphabetical';
export type CategoryFilterType = 'All' | TaskCategoryType;

interface TaskState {
  tasks: Task[];
  filterBy: FilterType;
  sortBy: SortType;
  categoryFilter: CategoryFilterType;
  searchQuery: string;
  isLoaded: boolean;

  // Actions
  loadTasks: () => Promise<void>;
  addTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  clearTasks: () => Promise<void>;
  clearCompletedTasks: () => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setCategoryFilter: (category: CategoryFilterType) => void;
  setSearchQuery: (query: string) => void;
}

export const useTaskStore = create<TaskState>()(
  (set, get) => ({
    tasks: [],
    filterBy: 'All',
    sortBy: 'Newest',
    categoryFilter: 'All',
    searchQuery: '',
    isLoaded: false,

    setFilter: (filter) => set({ filterBy: filter }),
    setSort: (sort) => set({ sortBy: sort }),
    setCategoryFilter: (category) => set({ categoryFilter: category }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    loadTasks: async () => {
      try {
        const dbTasks = await TaskRepository.getAllTasks();
        set({ tasks: dbTasks, isLoaded: true });
        Logger.info(`[TaskStore] Loaded ${dbTasks.length} tasks from database.`);
      } catch (error) {
        Logger.error('[TaskStore] Failed to load tasks from database.', error);
        ErrorHandler.handle(error, 'TaskStore.loadTasks');
      }
    },

    addTask: async (data) => {
      try {
        // TaskService persists and publishes TASK_CREATED
        const newTask = await TaskService.createTask(data);
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        AIService.invalidateCache();
      } catch (error) {
        Logger.error('[TaskStore] Failed to add task.', error);
        ErrorHandler.handle(error, 'TaskStore.addTask');
      }
    },

    updateTask: async (id, data) => {
      const originalTasks = get().tasks;
      const originalTask = originalTasks.find((t) => t.id === id);

      // 1. Optimistic UI Update
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...data, updatedAt: new Date() } : task
        ),
      }));

      // 2. Background SQLite Write — TaskService publishes TASK_UPDATED
      try {
        await TaskService.updateTaskProperties(id, data, originalTask);
      } catch (error) {
        // 3. Rollback on failure
        Logger.error('[TaskStore] Failed to update task — rolling back.', error, { id, data });
        set({ tasks: originalTasks });
        ErrorHandler.handle(error, 'TaskStore.updateTask');
      }
    },

    deleteTask: async (id) => {
      const originalTasks = get().tasks;

      // 1. Optimistic Update
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));

      // 2. Background DB Delete — EventBus published by TaskService.softDeleteTask
      try {
        await TaskRepository.permanentlyDeleteTask(id);
        Logger.info(`[TaskStore] Task permanently deleted (id: ${id})`);
      } catch (error) {
        Logger.error('[TaskStore] Failed to delete task — rolling back.', error, { id });
        set({ tasks: originalTasks });
        ErrorHandler.handle(error, 'TaskStore.deleteTask');
      }
    },

    toggleComplete: async (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) {
        Logger.warn(`[TaskStore] toggleComplete called for unknown task id: ${id}`);
        return;
      }

      const originalTasks = get().tasks;
      const isNowCompleted = !task.completed;

      // 1. Optimistic Update
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date() : undefined,
              updatedAt: new Date(),
            };
          }
          return t;
        }),
      }));

      // 2. DB Update via TaskService (which publishes TASK_COMPLETED event)
      try {
        await TaskService.toggleTaskCompletion(task);
      } catch (error) {
        Logger.error('[TaskStore] Failed to toggle task completion — rolling back.', error, { id });
        set({ tasks: originalTasks });
        ErrorHandler.handle(error, 'TaskStore.toggleComplete');
      }
    },

    clearTasks: async () => {
      const originalTasks = get().tasks;
      try {
        for (const t of originalTasks) {
          await TaskRepository.permanentlyDeleteTask(t.id);
        }
        set({ tasks: [] });
        Logger.info(`[TaskStore] Cleared all ${originalTasks.length} tasks.`);
      } catch (error) {
        Logger.error('[TaskStore] Failed to clear all tasks.', error);
        ErrorHandler.handle(error, 'TaskStore.clearTasks');
      }
    },

    clearCompletedTasks: async () => {
      const completedTasks = get().tasks.filter((t) => t.completed);
      const originalTasks = get().tasks;
      try {
        for (const t of completedTasks) {
          await TaskRepository.permanentlyDeleteTask(t.id);
        }
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));
        Logger.info(`[TaskStore] Cleared ${completedTasks.length} completed tasks.`);
      } catch (error) {
        Logger.error('[TaskStore] Failed to clear completed tasks.', error);
        set({ tasks: originalTasks });
        ErrorHandler.handle(error, 'TaskStore.clearCompletedTasks');
      }
    },
  })
);
