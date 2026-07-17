import { create } from 'zustand';

interface CalendarState {
  selectedDate: string;
  viewMode: 'month' | 'week';
  
  // Actions
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: 'month' | 'week') => void;
  resetToToday: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'month',

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  resetToToday: () => set({ selectedDate: new Date().toISOString().split('T')[0] }),
}));
