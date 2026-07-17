import React from 'react';
import { View, Text } from 'react-native';
import { Task } from '../../types/task';

interface DailyProgressCardProps {
  tasks: Task[];
}

export function DailyProgressCard({ tasks }: DailyProgressCardProps) {
  // Only count tasks that are not archived
  const activeTasks = tasks.filter(t => !t.isArchived);
  const total = activeTasks.length;
  const completed = activeTasks.filter(t => t.isCompleted).length;
  
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  let message = "Let's get started!";
  if (total === 0) {
    message = "No tasks yet. Enjoy your day!";
  } else if (percentage === 100) {
    message = "All done! Amazing work today!";
  } else if (percentage >= 75) {
    message = "Almost there, finish strong!";
  } else if (percentage >= 50) {
    message = "Halfway there, keep it up!";
  }

  return (
    <View className="bg-white dark:bg-gray-800 rounded-3xl p-5 mb-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase tracking-widest text-[10px]">
            Daily Progress
          </Text>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            {message}
          </Text>
        </View>
        <View className="bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-full">
          <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
            {percentage}%
          </Text>
        </View>
      </View>

      <View className="mb-2">
        <View className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </View>
      </View>

      <Text className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-1 text-right">
        {completed} of {total} tasks completed
      </Text>
    </View>
  );
}
