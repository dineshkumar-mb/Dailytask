import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTaskStore } from '../store/taskStore';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/ui/Button';

export default function ArchivedTasks() {
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const archivedTasks = tasks.filter(task => task.archived && !task.deleted);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-5">
      <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Archived</Text>
      
      {archivedTasks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">No archived tasks</Text>
        </View>
      ) : (
        <FlatList
          data={archivedTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <TaskCard 
                task={item} 
                onPress={() => router.push(`/task/${item.id}` as any)}
                onToggleComplete={() => toggleComplete(item.id)}
                onDelete={() => deleteTask(item.id)}
              />
              <TouchableOpacity 
                onPress={() => updateTask(item.id, { archived: false })}
                className="mt-[-10px] mb-4 bg-gray-200 dark:bg-gray-800 self-start px-3 py-1 rounded-full ml-2"
              >
                <Text className="text-xs font-bold text-gray-700 dark:text-gray-300">Unarchive</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <Button title="Go Back" onPress={() => router.back()} className="mt-4 mb-8" variant="secondary" />
    </View>
  );
}
