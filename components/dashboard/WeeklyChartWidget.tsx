import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { Card } from '../ui/Card';
import { useDashboardStore } from '../../store/dashboardStore';
import { useTaskStore } from '../../store/taskStore';
import { CalendarService } from '../../services/CalendarService';

interface BarProps {
  dayName: string;
  dateStr: string;
  count: number;
  maxCount: number;
  index: number;
}

function AnimatedBar({ dayName, dateStr, count, maxCount, index }: BarProps) {
  const heightValue = useSharedValue(0);

  useEffect(() => {
    // Staggered animation
    const targetHeight = maxCount > 0 ? Math.max((count / maxCount) * 100, 5) : 5; 
    heightValue.value = withDelay(index * 100, withTiming(targetHeight, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    }));
  }, [count, maxCount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: `${heightValue.value}%`,
    };
  });

  const isToday = CalendarService.formatDate(new Date()) === dateStr;

  const handlePress = () => {
    const tasks = useTaskStore.getState().tasks;
    const completedThatDay = tasks.filter(t => t.completed && CalendarService.formatDate(t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt)) === dateStr);
    
    if (completedThatDay.length === 0) {
      Alert.alert(dayName, "No tasks completed on this day.");
    } else {
      const taskNames = completedThatDay.map(t => `• ${t.title}`).join('\n');
      Alert.alert(`${dayName} (${count} completed)`, taskNames);
    }
  };

  return (
    <TouchableOpacity 
      className="items-center flex-1" 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="h-32 w-full justify-end items-center mb-2">
        <View className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-t-lg absolute bottom-0 opacity-50" />
        <Animated.View 
          className={`w-full rounded-t-lg ${isToday ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-600'}`}
          style={animatedStyle} 
        />
      </View>
      <Text className={`text-xs font-medium ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
        {dayName}
      </Text>
      <Text className="text-[10px] text-gray-400 mt-0.5">{count}</Text>
    </TouchableOpacity>
  );
}

export function WeeklyChartWidget() {
  const metrics = useDashboardStore((state) => state.metrics);
  const weeklyStats = metrics?.weeklyStats || [];

  // Find max to scale bars appropriately
  const maxCount = Math.max(...weeklyStats.map(s => s.completedCount), 1);

  return (
    <Card className="mb-6 p-5">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">Weekly Productivity</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-xs">Tap a bar</Text>
      </View>
      
      <View className="flex-row justify-between gap-2 h-44">
        {weeklyStats.map((stat, index) => (
          <AnimatedBar 
            key={stat.date}
            dayName={stat.dayName}
            dateStr={stat.date}
            count={stat.completedCount}
            maxCount={maxCount}
            index={index}
          />
        ))}
      </View>
    </Card>
  );
}
