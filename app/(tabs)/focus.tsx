import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePomodoro, PomodoroMode } from '../../hooks/usePomodoro';
import { useTaskStore } from '../../store/taskStore';

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const tasks = useTaskStore(state => state.tasks);
  
  // Find the focused task if a taskId was passed
  const focusedTask = taskId ? tasks.find(t => t.id === taskId) : null;
  
  const {
    mode,
    formattedTime,
    isActive,
    sessionsCompleted,
    progress,
    toggleTimer,
    resetTimer,
    skipSession,
    switchMode
  } = usePomodoro();

  const getModeTitle = (m: PomodoroMode) => {
    switch(m) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  const getModeColor = (m: PomodoroMode) => {
    switch(m) {
      case 'work': return 'text-blue-500';
      case 'shortBreak': return 'text-green-500';
      case 'longBreak': return 'text-purple-500';
    }
  };

  const getBgColor = (m: PomodoroMode) => {
    switch(m) {
      case 'work': return 'bg-blue-500';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-purple-500';
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-16 px-6 items-center">
      
      {/* Top Navigation / Current Task */}
      <View className="w-full flex-row justify-center mb-10">
        {focusedTask ? (
          <View className="items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Currently Focusing On</Text>
            <Text className="text-sm text-gray-900 dark:text-white font-bold" numberOfLines={1}>
              {focusedTask.title}
            </Text>
          </View>
        ) : (
          <View className="items-center px-4 py-2">
            <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pomodoro Timer</Text>
          </View>
        )}
      </View>

      {/* Mode Selectors */}
      <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-full p-1 mb-12">
        {(['work', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => switchMode(m)}
            className={`px-4 py-2 rounded-full ${mode === m ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <Text className={`text-xs font-bold ${mode === m ? getModeColor(m) : 'text-gray-500'}`}>
              {getModeTitle(m)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer Display */}
      <View className="items-center justify-center mb-16 relative w-64 h-64">
        {/* Simple Progress Ring (Using basic borders for now, SVG would be better in production) */}
        <View className="absolute w-full h-full rounded-full border-[12px] border-gray-200 dark:border-gray-800" />
        
        <Text className={`text-6xl font-black ${getModeColor(mode)} tabular-nums`}>
          {formattedTime}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Session {sessionsCompleted + 1}
        </Text>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-center space-x-6 w-full px-10">
        <TouchableOpacity 
          onPress={resetTimer}
          className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center"
        >
          <Ionicons name="refresh" size={24} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={toggleTimer}
          className={`w-24 h-24 rounded-full items-center justify-center shadow-lg ${getBgColor(mode)}`}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={40} color="white" style={{ marginLeft: isActive ? 0 : 4 }} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={skipSession}
          className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center"
        >
          <Ionicons name="play-skip-forward" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

    </View>
  );
}
