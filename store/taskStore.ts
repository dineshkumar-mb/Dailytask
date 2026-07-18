import { create } from 'zustand';
import { Task, TaskFormData, TaskCategoryType } from '../types/task';
import { TaskService } from '../services/TaskService';
import { TaskRepository } from '../repository/TaskRepository';
import { Alert } from 'react-native';
import { EventBus } from '../services/EventBus';

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
  clearTasks: () => Promise<void>; // Clear all data
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
      } catch (error) {
        console.error("Failed to load tasks from DB", error);
        Alert.alert("Database Error", "Failed to load your tasks.");
      }
    },

    addTask: async (data) => {
      // Create full task object to optimistically insert
      const newTask = await TaskService.createTask(data); // In a real robust optimistic UI, we create the UUID client side, update state, THEN await service. TaskService.createTask does DB insert.
      
      // Let's do pseudo-optimistic for add (Service creates it, then we add to UI)
      // Since creating is fast locally, awaiting DB before UI update is usually fine for local SQLite.
      set((state) => ({ tasks: [newTask, ...state.tasks] }));
      
      EventBus.publish('TASK_CREATED', newTask);
    },

    updateTask: async (id, data) => {
      const originalTasks = get().tasks;
      
      // 1. Optimistic UI Update
      set((state) => ({
        tasks: state.tasks.map((task) => 
          task.id === id ? { ...task, ...data, updatedAt: new Date() } : task
        ),
      }));

      // 2. Background SQLite Write
      try {
        await TaskService.updateTaskProperties(id, data);
        EventBus.publish('TASK_UPDATED', { id, data });
      } catch (error) {
        // 3. Rollback on failure
        console.error("Failed to update task", error);
        set({ tasks: originalTasks });
        Alert.alert("Sync Error", "Failed to save your changes.");
      }
    },

    deleteTask: async (id) => {
      const originalTasks = get().tasks;
      
      // 1. Optimistic Update
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));

      // 2. Background DB Delete
      try {
        await TaskRepository.permanentlyDeleteTask(id);
        EventBus.publish('TASK_DELETED', id);
      } catch (error) {
        set({ tasks: originalTasks });
        Alert.alert("Sync Error", "Failed to delete task.");
      }
    },

    toggleComplete: async (id) => {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return;

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
              updatedAt: new Date() 
            };
          }
          return t;
        }),
      }));

      // 2. DB Update
      try {
        // Bypass service for a sec, just update repo
        await TaskService.updateTaskProperties(id, { 
          completed: isNowCompleted, 
          completedAt: isNowCompleted ? new Date() : undefined 
        });
        EventBus.publish('TASK_COMPLETED', { id, completed: isNowCompleted });
      } catch (error) {
        set({ tasks: originalTasks });
      }
    },

    clearTasks: async () => {
      // Clear ALL tasks
      try {
        const tasks = get().tasks;
        for (const t of tasks) {
          await TaskRepository.permanentlyDeleteTask(t.id);
        }
        set({ tasks: [] });
      } catch (e) {
        console.error(e);
      }
    },
    
    clearCompletedTasks: async () => {
      try {
        const completedTasks = get().tasks.filter(t => t.completed);
        for (const t of completedTasks) {
          await TaskRepository.permanentlyDeleteTask(t.id);
        }
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed)
        }));
      } catch (e) {
        console.error(e);
      }
    },
  })
);
