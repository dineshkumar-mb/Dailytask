import React from 'react';
import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { TaskFormData } from '../types/task';
import { useTaskStore } from '../store/taskStore';
import { TaskForm } from '../components/task/TaskForm';

export default function AddTask() {
  const addTask = useTaskStore((state) => state.addTask);

  const onSubmit = (data: TaskFormData) => {
    addTask(data);
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Create New Task</Text>
      <TaskForm onSubmit={onSubmit} submitLabel="Save Task" />
    </ScrollView>
  );
}
