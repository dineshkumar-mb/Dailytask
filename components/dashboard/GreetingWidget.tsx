import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { DashboardService } from '../../services/DashboardService';

export function GreetingWidget() {
  const userName = useAuthStore((state) => state.userName);
  const greeting = DashboardService.getGreeting();

  return (
    <View className="flex-row justify-between items-center mb-6">
      <View>
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}, {userName || 'there'} 👋
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-1">Here is your dashboard for today.</Text>
      </View>
      
      {/* Settings Icon */}
      <TouchableOpacity 
        className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 items-center justify-center shadow-sm"
        onPress={() => router.push('/settings' as any)}
      >
        <Ionicons name="settings-outline" size={24} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}
