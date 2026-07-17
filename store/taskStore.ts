import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskFormData, TaskCategoryType } from '../types/task';

export type FilterType = 'All' | 'Active' | 'Completed';
export type SortType = 'Newest' | 'Priority' | 'Alphabetical';
export type CategoryFilterType = 'All' | TaskCategoryType;

interface TaskState {
  tasks: Task[];
  filterBy: FilterType;
  sortBy: SortType;
  categoryFilter: CategoryFilterType;
  searchQuery: string;
  
  addTask: (data: TaskFormData) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  clearTasks: () => void;
  clearCompletedTasks: () => void;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setCategoryFilter: (category: CategoryFilterType) => void;
  setSearchQuery: (query: string) => void;
}

// We can remove MOCK_TASKS since we'll rely on local storage!
export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      filterBy: 'All',
      sortBy: 'Newest',
      categoryFilter: 'All',
      searchQuery: '',

      setFilter: (filter) => set({ filterBy: filter }),
      setSort: (sort) => set({ sortBy: sort }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addTask: (data) => {
        const newTask: Task = {
          ...data,
          id: uuidv4(),
          completed: false,
          archived: false,
          deleted: false,
          subtasks: [],
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === id ? { ...task, ...data, updatedAt: new Date() } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const isNowCompleted = !task.completed;
              return { 
                ...task, 
                completed: isNowCompleted, 
                completedAt: isNowCompleted ? new Date() : undefined,
                updatedAt: new Date() 
              };
            }
            return task;
          }),
        }));
      },

      clearTasks: () => set({ tasks: [] }),
      
      clearCompletedTasks: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed)
        }));
      },
    }),
    {
      name: 'task-storage', // unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
