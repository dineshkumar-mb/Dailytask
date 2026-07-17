import { create } from 'zustand';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  notificationsEnabled: true,

  setTheme: (theme) => set({ theme }),
  
  toggleNotifications: () => set((state) => ({ 
    notificationsEnabled: !state.notificationsEnabled 
  })),
}));
