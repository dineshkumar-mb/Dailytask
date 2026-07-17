import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Button } from '../components/ui/Button';
import { TaskCard } from '../components/task/TaskCard';
import { Task } from '../types/task';

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Buy groceries', category: 'Shopping', priority: 'High', isCompleted: false, isArchived: false, createdAt: new Date() },
  { id: '2', title: 'Finish React Native course', category: 'Study', priority: 'Medium', isCompleted: false, isArchived: false, createdAt: new Date() },
  { id: '3', title: 'Schedule dentist appointment', category: 'Health', priority: 'Low', isCompleted: true, isArchived: false, createdAt: new Date() },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-5">
      
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900">Hello there 👋</Text>
          <Text className="text-gray-500 mt-1">Here are your tasks for today.</Text>
        </View>
        
        {/* Settings Icon (Mock) */}
        <Button 
          title="⚙️" 
          variant="secondary" 
          className="w-12 h-12 rounded-full p-0 bg-gray-200"
          onPress={() => router.push('/settings' as any)} 
        />
      </View>

      {/* List */}
      <View className="flex-1">
        {/* @ts-expect-error React 19 type mismatch for FlashList props */}
        <FlashList
          data={tasks}
          keyExtractor={(item) => item.id}
          estimatedItemSize={76}
          renderItem={({ item }) => (
            <TaskCard 
              task={item} 
              onPress={() => router.push(`/task/${item.id}` as any)}
              onToggleComplete={() => toggleTask(item.id)}
            />
          )}
        />
      </View>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 right-5 w-16 h-16">
        <Button 
          title="+" 
          variant="primary" 
          className="w-full h-full rounded-full shadow-lg shadow-blue-500/50"
          onPress={() => router.push('/add' as any)} 
        />
      </View>

    </View>
  );
}
