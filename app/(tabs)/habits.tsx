import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Habit {
  id: string;
  title: string;
  icon: string;
  color: string;
  completedToday: boolean;
  streak: number;
  target: number; // days per week
}

const INITIAL_HABITS: Habit[] = [
  { id: '1', title: 'Drink Water', icon: '💧', color: '#3b82f6', completedToday: false, streak: 0, target: 7 },
  { id: '2', title: 'Exercise', icon: '🏃', color: '#10b981', completedToday: false, streak: 0, target: 5 },
  { id: '3', title: 'Read', icon: '📚', color: '#8b5cf6', completedToday: false, streak: 0, target: 7 },
  { id: '4', title: 'Meditate', icon: '🧘', color: '#f59e0b', completedToday: false, streak: 0, target: 7 },
];

const HABIT_IDEAS = [
  { title: 'Journaling', icon: '📝', color: '#ec4899' },
  { title: 'Cold Shower', icon: '🚿', color: '#06b6d4' },
  { title: 'No Screen 1hr', icon: '📵', color: '#64748b' },
  { title: 'Gratitude', icon: '🙏', color: '#f97316' },
  { title: 'Walk 10k Steps', icon: '👟', color: '#84cc16' },
  { title: 'Sleep by 10pm', icon: '😴', color: '#6366f1' },
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              completedToday: !h.completedToday,
              streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );
  };

  const addHabitIdea = (idea: typeof HABIT_IDEAS[0]) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: idea.title,
      icon: idea.icon,
      color: idea.color,
      completedToday: false,
      streak: 0,
      target: 7,
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const completionPct = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar style="auto" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-5 pt-14 pb-4">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Habits</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Build consistency, one day at a time.</Text>
        </View>

        {/* Progress Card */}
        <View className="mx-5 mb-6 bg-green-500 rounded-3xl p-5 shadow-lg">
          <Text className="text-white/80 font-medium mb-1">Today's Progress</Text>
          <Text className="text-white text-4xl font-black mb-3">
            {completedCount} / {habits.length}
          </Text>
          {/* Progress bar */}
          <View className="bg-white/30 rounded-full h-2.5 overflow-hidden">
            <View
              className="bg-white rounded-full h-2.5"
              style={{ width: `${completionPct}%` }}
            />
          </View>
          <Text className="text-white/80 text-xs mt-2 font-medium">{completionPct}% complete</Text>
        </View>

        {/* Today's Habits */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Today</Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
            {habits.map((habit, index) => (
              <TouchableOpacity
                key={habit.id}
                onPress={() => toggleHabit(habit.id)}
                activeOpacity={0.7}
                className={`flex-row items-center p-4 ${index < habits.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                {/* Icon */}
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <Text className="text-xl">{habit.icon}</Text>
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className={`font-semibold text-base ${habit.completedToday ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {habit.title}
                  </Text>
                  {habit.streak > 0 && (
                    <Text className="text-xs text-orange-500 font-medium mt-0.5">
                      🔥 {habit.streak} day streak
                    </Text>
                  )}
                </View>

                {/* Checkmark */}
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                    habit.completedToday
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {habit.completedToday && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habit Ideas */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Suggested Habits</Text>
            <Text className="text-xs text-gray-400">Tap to add</Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {HABIT_IDEAS.filter((idea) => !habits.find((h) => h.title === idea.title)).map((idea) => (
              <TouchableOpacity
                key={idea.title}
                onPress={() => addHabitIdea(idea)}
                activeOpacity={0.75}
                className="flex-row items-center bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700 shadow-sm gap-2"
              >
                <Text className="text-lg">{idea.icon}</Text>
                <Text className="text-gray-700 dark:text-gray-200 font-medium text-sm">{idea.title}</Text>
                <Ionicons name="add-circle-outline" size={16} color={idea.color} />
              </TouchableOpacity>
            ))}
            {HABIT_IDEAS.filter((idea) => !habits.find((h) => h.title === idea.title)).length === 0 && (
              <Text className="text-gray-400 text-sm">All suggestions added! 🎉</Text>
            )}
          </View>
        </View>

        {/* Coming Soon Banner */}
        <View className="mx-5 mb-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-700/50 flex-row items-center gap-3">
          <Ionicons name="construct-outline" size={20} color="#8b5cf6" />
          <View className="flex-1">
            <Text className="text-purple-700 dark:text-purple-300 font-semibold text-sm">Full Habit Tracker Coming Soon</Text>
            <Text className="text-purple-500 dark:text-purple-400 text-xs mt-0.5">
              Detailed stats, weekly calendar view, reminders, and streaks with cloud sync.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
