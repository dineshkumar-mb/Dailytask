import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTaskStore } from '../../store/taskStore';
import { Button } from '../../components/ui/Button';

export default function TaskDetails() {
  const { id } = useLocalSearchParams();
  const tasks = useTaskStore((state) => state.tasks);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 p-5">
        <Text className="text-gray-500 dark:text-gray-400">Task not found!</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-5">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {task.title}
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-6">
        Category: {task.category} • Priority: {task.priority}
      </Text>
      
      <View className="gap-4">
        <Button 
          title="Edit Task" 
          onPress={() => router.push(`/edit/${task.id}` as any)} 
          variant="primary"
        />
        <Button 
          title="Delete Task" 
          onPress={() => {
            useTaskStore.getState().deleteTask(task.id);
            router.back();
          }} 
          variant="danger"
        />
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          variant="secondary"
        />
      </View>
    </View>
  );
}
