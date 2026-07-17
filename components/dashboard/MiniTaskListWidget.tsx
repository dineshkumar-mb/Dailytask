import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../types/task';
import { TaskCard } from '../task/TaskCard';
import { router } from 'expo-router';
import { useTaskStore } from '../../store/taskStore';

interface MiniTaskListWidgetProps {
  title: string;
  tasks: Task[];
  onSeeAll: () => void;
  emptyMessage?: string;
  colorClass?: string;
}

export function MiniTaskListWidget({ 
  title, 
  tasks, 
  onSeeAll, 
  emptyMessage = "No tasks here.",
  colorClass = "text-blue-500"
}: MiniTaskListWidgetProps) {
  
  if (tasks.length === 0) {
    return null; // Don't render empty sections to keep dashboard clean, except maybe Today's tasks which is handled in the main dashboard.
  }

  const top3 = tasks.slice(0, 3);
  const hasMore = tasks.length > 3;

  const toggleTask = useTaskStore((state) => state.toggleComplete);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
        {hasMore && (
          <TouchableOpacity onPress={onSeeAll} className="flex-row items-center gap-1">
            <Text className={`${colorClass} font-semibold text-sm`}>See All ({tasks.length})</Text>
            <Ionicons name="chevron-forward" size={14} className={colorClass} />
          </TouchableOpacity>
        )}
      </View>

      <View className="gap-2">
        {top3.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onPress={() => router.push(`/task/${task.id}` as any)}
            onToggleComplete={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
          />
        ))}
      </View>
    </View>
  );
}
