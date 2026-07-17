import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginFormData } from '../types/auth';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  
  // Actions
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      isLoading: false,

      login: async (data: LoginFormData) => {
        set({ isLoading: true });
        // Simulate a 1 second network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        set({ isLoggedIn: true, isLoading: false });
      },

      logout: () => {
        set({ isLoggedIn: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
