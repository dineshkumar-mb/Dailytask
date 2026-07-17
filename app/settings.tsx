import React from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
export default function Settings() {
  const { theme, notificationsEnabled, setTheme, toggleNotifications } = useSettingsStore();

  const handleClearData = () => {
    Alert.alert('Clear Data', 'Are you sure you want to delete all tasks? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete all tasks (To be implemented)') }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      
      {/* Preferences Section */}
      <View className="mt-6 mb-8 px-5">
        <Text className="text-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">
          Preferences
        </Text>
        
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View>
              <Text className="text-base font-medium text-gray-900">Dark Mode</Text>
              <Text className="text-sm text-gray-500 mt-1">Currently using {theme}</Text>
            </View>
            <Switch 
              value={theme === 'dark'} 
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

          <View className="flex-row items-center justify-between p-4">
            <View>
              <Text className="text-base font-medium text-gray-900">Push Notifications</Text>
              <Text className="text-sm text-gray-500 mt-1">Daily task reminders</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={toggleNotifications} 
              trackColor={{ true: '#3b82f6' }}
            />
          </View>

        </View>
      </View>

      {/* Danger Zone */}
      <View className="mb-8 px-5">
        <Text className="text-red-500 font-semibold mb-2 uppercase text-xs tracking-wider">
          Danger Zone
        </Text>
        
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
