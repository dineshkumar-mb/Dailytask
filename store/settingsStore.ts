import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStoreService } from '../services/SecureStoreService';
import { Logger } from '../services/Logger';

export type ReminderOffset = 10 | 30 | 60 | 1440; // minutes before due date

export interface NotificationPreferences {
  taskRemindersEnabled: boolean;
  reminderOffsetMinutes: ReminderOffset;
  focusNotificationsEnabled: boolean;
  morningPlannerEnabled: boolean;
  morningPlannerHour: number;   // 0-23
  morningPlannerMinute: number; // 0-59
  eveningReviewEnabled: boolean;
  eveningReviewHour: number;
  eveningReviewMinute: number;
}

// Key used in SecureStore — never stored in AsyncStorage
const SECURE_API_KEY = 'gemini_api_key';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean; // legacy top-level toggle
  notifications: NotificationPreferences;

  // API key is NOT persisted via zustand — it lives in SecureStore only
  geminiApiKey: string | undefined;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotifications: () => void;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;

  /**
   * Persists the API key securely via SecureStoreService.
   * Never writes to AsyncStorage.
   */
  saveApiKey: (key: string) => Promise<void>;

  /**
   * Loads the API key from SecureStore into in-memory state.
   * Call once on app startup (e.g. in _layout.tsx useEffect).
   * Also performs a one-time migration from AsyncStorage if a legacy key exists.
   */
  loadApiKey: () => Promise<void>;

  /**
   * Removes the API key from SecureStore and clears in-memory state.
   */
  clearApiKey: () => Promise<void>;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  taskRemindersEnabled: true,
  reminderOffsetMinutes: 30,
  focusNotificationsEnabled: true,
  morningPlannerEnabled: false,
  morningPlannerHour: 8,
  morningPlannerMinute: 0,
  eveningReviewEnabled: false,
  eveningReviewHour: 21,
  eveningReviewMinute: 0,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notificationsEnabled: true,
      notifications: DEFAULT_NOTIFICATION_PREFS,
      geminiApiKey: undefined,

      setTheme: (theme) => set({ theme }),

      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      setNotificationPreference: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),

      saveApiKey: async (key: string) => {
        try {
          await SecureStoreService.setItem(SECURE_API_KEY, key.trim());
          set({ geminiApiKey: key.trim() });
          Logger.info('[SettingsStore] API key saved to SecureStore.');
        } catch (error) {
          Logger.error('[SettingsStore] Failed to save API key to SecureStore.', error);
          throw error;
        }
      },

      loadApiKey: async () => {
        try {
          let key = await SecureStoreService.getItem(SECURE_API_KEY);

          // One-time migration: if nothing in SecureStore, check legacy AsyncStorage
          if (!key) {
            const legacyRaw = await AsyncStorage.getItem('settings-storage');
            if (legacyRaw) {
              try {
                const parsed = JSON.parse(legacyRaw);
                const legacyKey = parsed?.state?.geminiApiKey;
                if (legacyKey && typeof legacyKey === 'string') {
                  Logger.info('[SettingsStore] Migrating API key from AsyncStorage → SecureStore.');
                  await SecureStoreService.setItem(SECURE_API_KEY, legacyKey);
                  key = legacyKey;
                  // Remove legacy key from AsyncStorage persisted state
                  const cleaned = { ...parsed, state: { ...parsed.state, geminiApiKey: undefined } };
                  await AsyncStorage.setItem('settings-storage', JSON.stringify(cleaned));
                }
              } catch (parseError) {
                Logger.warn('[SettingsStore] Could not parse legacy settings for migration.', parseError);
              }
            }
          }

          if (key) {
            set({ geminiApiKey: key });
            Logger.info('[SettingsStore] API key loaded from SecureStore.');
          }
        } catch (error) {
          Logger.error('[SettingsStore] Failed to load API key from SecureStore.', error);
        }
      },

      clearApiKey: async () => {
        try {
          await SecureStoreService.deleteItem(SECURE_API_KEY);
          set({ geminiApiKey: undefined });
          Logger.info('[SettingsStore] API key cleared from SecureStore.');
        } catch (error) {
          Logger.error('[SettingsStore] Failed to clear API key from SecureStore.', error);
          throw error;
        }
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // geminiApiKey is intentionally excluded — stored in SecureStore only
      partialize: (state) => ({
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        notifications: state.notifications,
      }),
    }
  )
);
