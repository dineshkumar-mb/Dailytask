import React, { useRef, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../store/taskStore';
import { AIChatModal } from './AIChatModal';

// ─── Action Button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  backgroundColor: string;
  accessibilityLabel?: string;
}

function ActionButton({ label, icon, onPress, backgroundColor, accessibilityLabel }: ActionButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onPress();
  };

  return (
    <TouchableOpacity
      className="items-center mr-4"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.75}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="button"
    >
      <Animated.View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-2 shadow-sm"
        style={{ backgroundColor, transform: [{ scale: scaleValue }] }}
      >
        <Ionicons name={icon} size={24} color="white" />
      </Animated.View>
      <Text className="text-gray-700 dark:text-gray-300 font-medium text-xs">{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

import { ScrollView } from 'react-native';

export function QuickActionsWidget() {
  const [aiVisible, setAiVisible] = useState(false);
  const tasks = useTaskStore((s) => s.tasks);

  // Memoized so it doesn't recompute on every parent render
  const firstIncompleteTaskId = useMemo(() => {
    return tasks.find((t) => !t.completed && !t.deleted && !t.archived)?.id ?? null;
  }, [tasks]);

  const handleFocus = () => {
    if (firstIncompleteTaskId) {
      router.push(`/focus/${firstIncompleteTaskId}` as any);
    } else {
      router.push('/focus/free' as any);
    }
  };

  return (
    <>
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Quick Actions
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row py-1">
            <ActionButton
              label="+ Task"
              icon="add"
              backgroundColor="#3b82f6"
              onPress={() => router.push('/add' as any)}
              accessibilityLabel="Add new task"
            />
            <ActionButton
              label="Calendar"
              icon="calendar"
              backgroundColor="#8b5cf6"
              onPress={() => router.push('/(tabs)/calendar' as any)}
              accessibilityLabel="Open calendar"
            />
            <ActionButton
              label="Focus"
              icon="timer-outline"
              backgroundColor="#ef4444"
              onPress={handleFocus}
              accessibilityLabel={firstIncompleteTaskId ? 'Start focus session on first task' : 'Start free focus session'}
            />
            <ActionButton
              label="Habits"
              icon="leaf-outline"
              backgroundColor="#10b981"
              onPress={() => router.push('/(tabs)/habits' as any)}
              accessibilityLabel="Open habits tracker"
            />
            <ActionButton
              label="AI"
              icon="sparkles-outline"
              backgroundColor="#6366f1"
              onPress={() => setAiVisible(true)}
              accessibilityLabel="Open AI assistant"
            />
          </View>
        </ScrollView>
      </View>

      <AIChatModal visible={aiVisible} onClose={() => setAiVisible(false)} />
    </>
  );
}
