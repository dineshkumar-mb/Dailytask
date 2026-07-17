import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginFormData } from '../types/auth';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string | null;
  
  // Actions
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      isLoading: false,
      userName: null,

      login: async (data: LoginFormData) => {
        set({ isLoading: true });
        // Simulate a 1 second network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Extract a simple username from the email
        const namePart = data.email.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/\./g, ' ');

        set({ isLoggedIn: true, isLoading: false, userName: formattedName });
      },

      logout: () => {
        set({ isLoggedIn: false, userName: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
