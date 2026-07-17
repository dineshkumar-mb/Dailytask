import { create } from 'zustand';
import { Task, TaskFormData } from '../types/task';

export type FilterType = 'All' | 'Active' | 'Completed';
export type SortType = 'Newest' | 'Priority' | 'Alphabetical';

interface TaskState {
  tasks: Task[];
  filterBy: FilterType;
  sortBy: SortType;
  
  // Actions
  addTask: (data: TaskFormData) => void;
  updateTask: (id: string, data: Partial<TaskFormData>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
}

// Initial mock data just so we have something to look at!
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Buy groceries', category: 'Shopping', priority: 'High', isCompleted: false, isArchived: false, createdAt: new Date() },
  { id: '2', title: 'Finish React Native course', category: 'Study', priority: 'Medium', isCompleted: false, isArchived: false, createdAt: new Date() },
  { id: '3', title: 'Schedule dentist appointment', category: 'Health', priority: 'Low', isCompleted: true, isArchived: false, createdAt: new Date() },
];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: MOCK_TASKS,
  filterBy: 'All',
  sortBy: 'Newest',

  setFilter: (filter) => set({ filterBy: filter }),
  setSort: (sort) => set({ sortBy: sort }),

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
}));
