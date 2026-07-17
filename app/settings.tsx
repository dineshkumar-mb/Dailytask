import React from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import type * as NotificationsType from 'expo-notifications';

let Notifications: typeof NotificationsType | null = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignored
}
export default function Settings() {
  const { theme, notificationsEnabled, setTheme, toggleNotifications } = useSettingsStore();
  const clearTasks = useTaskStore((state) => state.clearTasks);
  const logout = useAuthStore((state) => state.logout);

  const scheduleTestNotification = async () => {
    if (Notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a local push notification test!",
        },
        trigger: null, // Send immediately
      });
    } else {
      Alert.alert('Not Supported', 'Push notifications are not supported in this environment (e.g. Expo Go on Android).');
    }
  };

  const handleClearData = () => {
    Alert.alert('Clear Data', 'Are you sure you want to delete all tasks? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          clearTasks();
          Alert.alert('Success', 'All tasks have been deleted.');
        } 
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive', 
        onPress: () => {
          logout();
          // The router guard in _layout.tsx will automatically redirect to /login
        } 
      }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      
      {/* Preferences Section */}
      <View className="mt-6 mb-8 px-5">
        <Text className="text-gray-500 dark:text-gray-400 font-semibold mb-2 uppercase text-xs tracking-wider">
          Preferences
        </Text>
        
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">Dark Mode</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Currently using {theme}</Text>
            </View>
            <Switch 
              value={theme === 'dark'} 
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">Push Notifications</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily task reminders</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={toggleNotifications} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

          <TouchableOpacity 
            onPress={scheduleTestNotification}
            className="flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700"
          >
            <View>
              <Text className="text-base font-medium text-gray-900 dark:text-white">Test Notification</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Send a local push notification</Text>
            </View>
            <Text className="text-blue-500 font-medium">Send</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Danger Zone */}
      <View className="mb-8 px-5">
        <Text className="text-red-500 font-semibold mb-2 uppercase text-xs tracking-wider">
          Danger Zone
        </Text>
        
        <View className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
          >
            <Text className="text-base font-medium text-red-500">Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleClearData}
            className="flex-row items-center justify-between p-4"
          >
            <Text className="text-base font-medium text-red-500">Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View className="items-center mt-10 mb-12">
        <Text className="text-gray-400 font-medium">Daily Tasks App</Text>
        <Text className="text-gray-400 text-xs mt-1">Version 1.0.0</Text>
      </View>

    </ScrollView>
  );
}
