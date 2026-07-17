import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean; // legacy top-level toggle
  notifications: NotificationPreferences;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotifications: () => void;
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
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

      setTheme: (theme) => set({ theme }),

      toggleNotifications: () =>
        set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

      setNotificationPreference: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
