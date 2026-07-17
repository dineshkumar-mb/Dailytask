import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colorClass: string;
}

function ActionButton({ label, icon, onPress, colorClass }: ActionButtonProps) {
  return (
    <TouchableOpacity 
      className="items-center mr-4"
      onPress={onPress}
    >
      <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-2 shadow-sm ${colorClass}`}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text className="text-gray-700 dark:text-gray-300 font-medium text-xs">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function QuickActionsWidget() {
  const handlePlaceholder = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} will be available in a future update!`);
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row py-1">
          <ActionButton 
            label="+ Task" 
            icon="add" 
            colorClass="bg-blue-500" 
            onPress={() => router.push('/add' as any)} 
          />
          <ActionButton 
            label="Calendar" 
            icon="calendar-outline" 
            colorClass="bg-purple-500" 
            onPress={() => router.push('/calendar' as any)} 
          />
          <ActionButton 
            label="Focus" 
            icon="timer-outline" 
            colorClass="bg-red-500" 
            onPress={() => handlePlaceholder("Focus Mode")} 
          />
          <ActionButton 
            label="Habits" 
            icon="leaf-outline" 
            colorClass="bg-green-500" 
            onPress={() => handlePlaceholder("Habit Tracker")} 
          />
          <ActionButton 
            label="AI" 
            icon="sparkles-outline" 
            colorClass="bg-indigo-500" 
            onPress={() => handlePlaceholder("AI Assistant")} 
          />
        </View>
      </ScrollView>
    </View>
  );
}
