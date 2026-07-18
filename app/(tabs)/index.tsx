import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text } from 'react-native';
import { router } from 'expo-router';
import { useDashboardStore } from '../../store/dashboardStore';
import { GreetingWidget } from '../../components/dashboard/GreetingWidget';
import { ProgressWidget } from '../../components/dashboard/ProgressWidget';
import { StatsWidget } from '../../components/dashboard/StatsWidget';
import { QuickActionsWidget } from '../../components/dashboard/QuickActionsWidget';
import { WeeklyChartWidget } from '../../components/dashboard/WeeklyChartWidget';
import { MiniTaskListWidget } from '../../components/dashboard/MiniTaskListWidget';
import { Button } from '../../components/ui/Button';

// Skeleton Component
function DashboardSkeleton() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-12 px-5">
      <View className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-md mb-2 animate-pulse" />
      <View className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md mb-8 animate-pulse" />
      <View className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded-3xl mb-6 animate-pulse" />
      <View className="flex-row gap-3 mb-3">
        <View className="h-24 flex-1 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
        <View className="h-24 flex-1 bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
      </View>
    </View>
  );
}

export default function Home() {
  const metrics = useDashboardStore((state) => state.metrics);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const refreshDashboard = useDashboardStore((state) => state.refreshDashboard);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!metrics) {
      refreshDashboard();
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshDashboard();
    // Simulate slight network delay for better UX feel
    setTimeout(() => setRefreshing(false), 800); 
  }, [refreshDashboard]);

  if (isLoading && !metrics) {
    return <DashboardSkeleton />;
  }

  // Check if everything is empty
  const isEmpty = (metrics?.todayTasks.length === 0 && 
                   metrics?.upcomingTasks.length === 0 && 
                   metrics?.overdueTasks.length === 0 &&
                   metrics?.completedTodayCount === 0);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        contentContainerStyle={{ paddingTop: 48, paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <GreetingWidget />
        <QuickActionsWidget />
        
        {isEmpty ? (
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-8 items-center justify-center mb-6 border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">You're all caught up!</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
              Take a break, or create your first task for the day.
            </Text>
            <Button title="+ Add Task" onPress={() => router.push('/add' as any)} className="px-8 w-full" />
          </View>
        ) : (
          <>
            <ProgressWidget />
            <StatsWidget />
            <WeeklyChartWidget />
            
            <MiniTaskListWidget 
              title="Today's Tasks" 
              tasks={metrics?.todayTasks || []} 
              onSeeAll={() => console.log('See All Today')} 
              colorClass="text-blue-500" 
            />
            
            <MiniTaskListWidget 
              title="Overdue" 
              tasks={metrics?.overdueTasks || []} 
              onSeeAll={() => console.log('See All Overdue')} 
              colorClass="text-red-500" 
            />
            
            <MiniTaskListWidget 
              title="Upcoming" 
              tasks={metrics?.upcomingTasks || []} 
              onSeeAll={() => console.log('See All Upcoming')} 
              colorClass="text-purple-500" 
            />
          </>
        )}
      </ScrollView>

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
