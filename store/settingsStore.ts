import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notificationsEnabled: true,

      setTheme: (theme) => set({ theme }),
      
      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      })),
    }),
    {
      name: 'settings-storage', // unique name for AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
