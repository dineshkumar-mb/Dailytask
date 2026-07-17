import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardStore } from '../../store/dashboardStore';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  colorClass: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, colorClass, onPress }: StatCardProps) {
  return (
    <TouchableOpacity 
      className="bg-white dark:bg-gray-800 p-4 rounded-3xl flex-1 border border-gray-100 dark:border-gray-700 shadow-sm"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${colorClass}`}>
          <Ionicons name={icon} size={16} color="white" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
      </View>
      <Text className="text-gray-500 dark:text-gray-400 font-medium text-xs tracking-wide">
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function StatsWidget() {
  const metrics = useDashboardStore((state) => state.metrics);

  const todayCount = metrics?.todayTasks.length || 0;
  const upcomingCount = metrics?.upcomingTasks.length || 0;
  const overdueCount = metrics?.overdueTasks.length || 0;
  const streak = metrics?.streak || 0;

  return (
    <View className="mb-6">
      <View className="flex-row gap-3 mb-3">
        <StatCard 
          title="Today's Tasks" 
          value={todayCount} 
          icon="calendar-outline" 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title="Upcoming" 
          value={upcomingCount} 
          icon="calendar-clear-outline" 
          colorClass="bg-purple-500" 
        />
      </View>
      <View className="flex-row gap-3">
        <StatCard 
          title="Overdue" 
          value={overdueCount} 
          icon="alert-circle-outline" 
          colorClass="bg-red-500" 
        />
        <StatCard 
          title="Day Streak" 
          value={`${streak} 🔥`}
          icon="flame-outline" 
          colorClass="bg-orange-500" 
        />
      </View>
    </View>
  );
}
