import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TaskFormData } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { Button } from '../../components/ui/Button';
import { TaskForm } from '../../components/task/TaskForm';

export default function EditTask() {
  const { id } = useLocalSearchParams();
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  
  // Find the exact task we are editing
  const taskToEdit = tasks.find((t) => t.id === id);

  const onSubmit = (data: TaskFormData) => {
    if (typeof id === 'string') {
      updateTask(id, data);
      router.back();
    }
  };

  if (!taskToEdit) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Task not found!</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-5">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Task</Text>
      <TaskForm 
        defaultValues={{
          title: taskToEdit.title,
          category: taskToEdit.category,
          priority: taskToEdit.priority,
        }} 
        onSubmit={onSubmit} 
        submitLabel="Update Task" 
      />
    </ScrollView>
  );
}
