import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types/task';
import { Card } from '../ui/Card';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onPress, onToggleComplete, onDelete }: TaskCardProps) {
  const [isCompletedVisual, setIsCompletedVisual] = useState(task.completed);

  // Sync visual state with actual prop if it changes externally
  useEffect(() => {
    setIsCompletedVisual(task.completed);
  }, [task.completed]);

  let priorityColor = 'text-green-500 bg-green-100';
  if (task.priority === 'Medium') priorityColor = 'text-orange-500 bg-orange-100';
  if (task.priority === 'High') priorityColor = 'text-red-500 bg-red-100';
  if (task.priority === 'Urgent') priorityColor = 'text-white bg-red-600';

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Visually toggle it immediately
    const nextState = !isCompletedVisual;
    setIsCompletedVisual(nextState);
    
    // Delay the actual store update so the user can see the strikethrough animation
    setTimeout(() => {
      onToggleComplete();
    }, 400); 
  };

  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        onPress={handleDelete}
        className="bg-red-500 justify-center items-center w-20 rounded-2xl mb-3 ml-3"
      >
        <Text className="text-white font-bold">Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View 
      entering={FadeInDown.springify().damping(12)}
      exiting={FadeOutUp}
    >
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <TouchableOpacity 
          onPress={onPress} 
          activeOpacity={0.8} 
          className="mb-3"
        >
          <Card className={`flex-row items-center p-4 bg-white dark:bg-gray-800 ${isCompletedVisual ? 'opacity-60' : 'opacity-100'} border ${isCompletedVisual ? 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50' : 'border-gray-100 dark:border-gray-700'}`}>
            
            {/* Checkbox */}
            <TouchableOpacity 
              onPress={handleToggle}
              className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center
                ${isCompletedVisual ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}
            >
              {isCompletedVisual && <Text className="text-white text-xs font-bold">✓</Text>}
            </TouchableOpacity>

            {/* Task Details */}
            <View className="flex-1">
              <Text 
                className={`text-base font-semibold text-gray-900 dark:text-white ${isCompletedVisual ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.category}</Text>
            </View>

            {/* Priority Badge */}
            <View className={`px-2 py-1 rounded-md ml-2 ${priorityColor.split(' ')[1]}`}>
              <Text className={`text-xs font-bold ${priorityColor.split(' ')[0]}`}>
                {task.priority}
              </Text>
            </View>

          </Card>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}
