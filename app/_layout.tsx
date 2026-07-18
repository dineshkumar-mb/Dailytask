import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { db } from '../db/client';
import { useTaskStore } from '../store/taskStore';
import { View, Text, Platform } from 'react-native';
import { NotificationService, setNotificationHandler } from '../services/NotificationService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { Logger } from '../services/Logger';

// Register notification handler at module level (must be outside any component)
setNotificationHandler();

// Custom hook to protect routes
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/');
    }
  }, [isLoggedIn, segments]);
}

function NativeInitializer({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const isLoaded = useTaskStore((state) => state.isLoaded);

  useEffect(() => {
    if (success) {
      loadTasks();
    }
  }, [success, loadTasks]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-red-500">Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success || !isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Loading your data...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

function WebInitializer({ children }: { children: React.ReactNode }) {
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const isLoaded = useTaskStore((state) => state.isLoaded);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Loading your data...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const Initializer = Platform.OS === 'web' ? WebInitializer : NativeInitializer;

export default function RootLayout() {
  useProtectedRoute();
  const router = useRouter();
  
  const theme = useSettingsStore((state) => state.theme);
  const notificationPrefs = useSettingsStore((state) => state.notifications);
  const loadApiKey = useSettingsStore((state) => state.loadApiKey);
  const { colorScheme, setColorScheme } = useColorScheme();

  // Load API key from SecureStore on mount (also performs one-time migration from AsyncStorage)
  useEffect(() => {
    loadApiKey().catch((e) => Logger.error('[RootLayout] Failed to load API key on startup.', e));
  }, []);

  // Sync NativeWind with our Zustand store
  useEffect(() => {
    try {
      setColorScheme(theme);
    } catch (e) {}
  }, [theme]);

  // Bootstrap: request notification permissions and wire tap listener
  useEffect(() => {
    NotificationService.requestPermissions();

    const unsubscribe = NotificationService.addTapListener(
      (taskId: string) => router.push(`/task/${taskId}` as any),
      () => router.push('/(tabs)' as any)
    );

    return () => { unsubscribe?.(); };
  }, []);

  // Sync daily reminders when settings change
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (notificationPrefs.morningPlannerEnabled) {
      NotificationService.scheduleMorningPlanner(
        notificationPrefs.morningPlannerHour,
        notificationPrefs.morningPlannerMinute
      );
    } else {
      NotificationService.cancelMorningPlanner();
    }
    if (notificationPrefs.eveningReviewEnabled) {
      NotificationService.scheduleEveningReview(
        notificationPrefs.eveningReviewHour,
        notificationPrefs.eveningReviewMinute
      );
    } else {
      NotificationService.cancelEveningReview();
    }
  }, [
    notificationPrefs.morningPlannerEnabled, notificationPrefs.morningPlannerHour, notificationPrefs.morningPlannerMinute,
    notificationPrefs.eveningReviewEnabled, notificationPrefs.eveningReviewHour, notificationPrefs.eveningReviewMinute,
  ]);

  const isDark = colorScheme === 'dark';

  return (
    <ErrorBoundary>
      <Initializer>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: isDark ? '#111827' : '#f9fafb' }, // dark:bg-gray-900 or bg-gray-50
              headerShadowVisible: false,
              headerTintColor: isDark ? '#ffffff' : '#111827',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            {/* Auth Screens */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />

            {/* App Screens */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add" options={{ title: 'Add New Task', presentation: 'modal' }} />
            <Stack.Screen name="edit/[id]" options={{ title: 'Edit Task', presentation: 'modal' }} />
            <Stack.Screen name="task/[id]" options={{ title: 'Task Details' }} />
            <Stack.Screen name="focus/[id]" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
      </Initializer>
    </ErrorBoundary>
  );
}
