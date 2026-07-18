import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginFormData, SignupFormData } from '../types/auth';
import { Logger } from '../services/Logger';
import { EventBus } from '../services/EventBus';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  userName: string | null;
  userEmail: string | null;

  // Actions
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      isLoading: false,
      userName: null,
      userEmail: null,

      login: async (data: LoginFormData) => {
        set({ isLoading: true });
        try {
          // Simulate network delay (replace with real auth service call)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const namePart = data.email.split('@')[0];
          const formattedName =
            namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/\./g, ' ');

          set({ isLoggedIn: true, isLoading: false, userName: formattedName, userEmail: data.email });
          Logger.info(`[AuthStore] User logged in: ${data.email}`);
        } catch (error) {
          set({ isLoading: false });
          Logger.error('[AuthStore] Login failed.', error);
          throw error;
        }
      },

      signup: async (data: SignupFormData) => {
        set({ isLoading: true });
        try {
          // Simulate network delay (replace with real auth service call)
          await new Promise((resolve) => setTimeout(resolve, 1200));

          const formattedName = data.name.trim();
          set({
            isLoggedIn: true,
            isLoading: false,
            userName: formattedName,
            userEmail: data.email,
          });
          Logger.info(`[AuthStore] New user signed up: ${data.email}`);
        } catch (error) {
          set({ isLoading: false });
          Logger.error('[AuthStore] Signup failed.', error);
          throw error;
        }
      },

      logout: () => {
        set({ isLoggedIn: false, userName: null, userEmail: null });
        Logger.info('[AuthStore] User logged out.');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        userName: state.userName,
        userEmail: state.userEmail,
      }),
    }
  )
);
