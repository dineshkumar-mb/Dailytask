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
  
  // Actions
  addTask: (data: TaskFormData) => void;
  updateTask: (id: string, data: Partial<TaskFormData>) => void;
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
          id: Date.now().toString(),
          isCompleted: false,
          isArchived: false,
          createdAt: new Date(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === id ? { ...task, ...data } : task
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
          tasks: state.tasks.map((task) => 
            task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
          ),
        }));
      },

      clearTasks: () => set({ tasks: [] }),
      
      clearCompletedTasks: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.isCompleted)
        }));
      },
    }),
    {
      name: 'task-storage', // unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
