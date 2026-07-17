import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTaskStore } from '../store/taskStore';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/ui/Button';

export default function Trash() {
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  
  // Also import set to clear trash if we want to do a "Empty Trash" button
  const emptyTrash = () => {
    Alert.alert('Empty Trash', 'Are you sure you want to permanently delete all tasks in the trash?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Empty Trash', 
        style: 'destructive',
        onPress: () => {
          const trashTasks = tasks.filter(task => task.deleted);
          trashTasks.forEach(t => deleteTask(t.id));
        }
      }
    ]);
  };

  const trashTasks = tasks.filter(task => task.deleted);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-5">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Trash</Text>
        {trashTasks.length > 0 && (
          <TouchableOpacity onPress={emptyTrash}>
            <Text className="text-red-500 font-bold">Empty</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {trashTasks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Trash is empty</Text>
        </View>
      ) : (
        <FlatList
          data={trashTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View className="opacity-50">
                <TaskCard 
                  task={item} 
                  onPress={() => {}} // Disabled in trash
                  onToggleComplete={() => {}} // Disabled in trash
                  onDelete={() => deleteTask(item.id)} // Permanent delete
                />
              </View>
              <View className="flex-row mt-[-10px] mb-4 ml-2 gap-2">
                <TouchableOpacity 
                  onPress={() => updateTask(item.id, { deleted: false })}
                  className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full"
                >
                  <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => deleteTask(item.id)}
                  className="bg-red-100 dark:bg-red-900/40 px-3 py-1 rounded-full"
                >
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">Delete Forever</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <Button title="Go Back" onPress={() => router.back()} className="mt-4 mb-8" variant="secondary" />
    </View>
  );
}
