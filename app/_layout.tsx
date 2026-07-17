import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: 'Daily Tasks' }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ title: 'Add New Task', presentation: 'modal' }} 
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
  );
}
