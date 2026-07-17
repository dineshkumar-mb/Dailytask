import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#f9fafb' }, // Tailwind bg-gray-50
          headerShadowVisible: false,
          headerTintColor: '#111827', // Tailwind text-gray-900
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="add" 
          options={{ title: 'Add New Task', presentation: 'modal' }} 
        />
        <Stack.Screen 
          name="edit/[id]" 
          options={{ title: 'Edit Task', presentation: 'modal' }} 
        />
        <Stack.Screen 
          name="task/[id]" 
          options={{ title: 'Task Details' }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ title: 'Settings' }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
