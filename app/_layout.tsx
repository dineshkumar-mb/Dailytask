import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';

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

export default function RootLayout() {
  useProtectedRoute();
  
  const theme = useSettingsStore((state) => state.theme);
  const { colorScheme, setColorScheme } = useColorScheme();

  // Sync NativeWind with our Zustand store
  useEffect(() => {
    setColorScheme(theme);
  }, [theme]);

  const isDark = colorScheme === 'dark';

  return (
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ title: 'Add New Task', presentation: 'modal' }} />
        <Stack.Screen name="edit/[id]" options={{ title: 'Edit Task', presentation: 'modal' }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Task Details' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
