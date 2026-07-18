import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusStore } from '../../store/focusStore';
import { useTaskStore } from '../../store/taskStore';
import { FocusRing } from '../../components/focus/FocusRing';
import { FocusService, FocusSessionType } from '../../services/FocusService';

const POMODORO_CONFIG = {
  focus: 25,
  short_break: 5,
  long_break: 15,
  sessionsBeforeLongBreak: 4,
};

type CycleMode = 'focus' | 'short_break' | 'long_break';

const MODE_LABELS: Record<CycleMode, string> = {
  focus: 'Focus',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const MODE_COLORS: Record<CycleMode, string> = {
  focus: '#3b82f6',       // blue (matches quick action)
  short_break: '#10b981', // green
  long_break: '#8b5cf6',  // purple
};

const MODE_RING_BG: Record<CycleMode, string> = {
  focus: '#dbeafe',
  short_break: '#d1fae5',
  long_break: '#f3e8ff',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const incompleteTasks = tasks.filter((t) => !t.completed && !t.deleted && !t.archived);

  const activeSession = useFocusStore((state) => state.activeSession);
  const timeLeft = useFocusStore((state) => state.timeLeft);
  const startSession = useFocusStore((state) => state.startSession);
  const pauseSession = useFocusStore((state) => state.pauseSession);
  const resumeSession = useFocusStore((state) => state.resumeSession);
  const finishSession = useFocusStore((state) => state.finishSession);
  const tick = useFocusStore((state) => state.tick);

  const [cycleMode, setCycleMode] = useState<CycleMode>('focus');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─── Tick loop — starts/stops with activeSession ───
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (activeSession && activeSession.status === 'running') {
      tickRef.current = setInterval(() => {
        tick();
      }, 500);
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeSession?.status, activeSession?.id]);

  // ─── Auto-advance when timeLeft hits 0 ───
  useEffect(() => {
    if (activeSession && timeLeft === 0) {
      handleSessionComplete();
    }
  }, [timeLeft]);

  // ─── Background recovery via AppState ───
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'background' && nextState === 'active') {
        tick();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  // Update cycleMode to match active session type if running
  useEffect(() => {
    if (activeSession) {
      setCycleMode(activeSession.type as CycleMode);
      setSelectedTaskId(activeSession.taskId);
    }
  }, [activeSession?.id]);

  const handleSessionComplete = useCallback(async () => {
    if (cycleMode === 'focus') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      
      const focusedTask = tasks.find(t => t.id === activeSession?.taskId);
      await finishSession('completed');

      if (focusedTask) {
        Alert.alert(
          '🎉 Session Complete!',
          `You focused on "${focusedTask.title}". Would you like to mark it as completed?`,
          [
            { text: 'Keep Active', style: 'cancel' },
            { 
              text: 'Complete Task', 
              onPress: () => toggleComplete(focusedTask.id) 
            }
          ]
        );
      } else {
        Alert.alert('🎉 Session Complete!', 'Great work staying focused!');
      }

      // Automatically go to break
      const nextMode: CycleMode = (newCount % POMODORO_CONFIG.sessionsBeforeLongBreak === 0) ? 'long_break' : 'short_break';
      setCycleMode(nextMode);
    } else {
      // Break ended
      await finishSession('completed');
      setCycleMode('focus');
      Alert.alert('☕ Break Over!', 'Ready to focus again?');
    }
  }, [cycleMode, sessionsCompleted, finishSession, activeSession, tasks]);

  const handleStart = () => {
    const minutes = POMODORO_CONFIG[cycleMode];
    startSession(selectedTaskId, cycleMode, minutes);
  };

  const handlePause = () => pauseSession();
  const handleResume = () => resumeSession();

  const handleStop = () => {
    Alert.alert(
      'Stop Session?',
      'This will save the session as interrupted.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await finishSession('interrupted');
          },
        },
      ]
    );
  };

  const isRunning = !!activeSession && activeSession.status === 'running';
  const isPaused = !!activeSession && activeSession.status === 'paused';
  const isIdle = !activeSession;

  const plannedSeconds = activeSession?.plannedSeconds ?? (POMODORO_CONFIG[cycleMode] * 60);
  const progress = isIdle ? 0 : Math.max(0, 1 - (timeLeft / plannedSeconds));

  const ringColor = MODE_COLORS[cycleMode];
  const ringBg = MODE_RING_BG[cycleMode];

  const currentTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-16 px-6 items-center">
      <StatusBar style="auto" />

      {/* Task selector / Indicator */}
      <View className="w-full items-center mb-8">
        {isIdle ? (
          <View className="w-full items-center">
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">Select a Task to Focus On</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2 flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedTaskId(null)}
                className={`px-4 py-2 rounded-full border ${selectedTaskId === null ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
              >
                <Text className={`text-xs font-bold ${selectedTaskId === null ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  ✨ Free Focus
                </Text>
              </TouchableOpacity>
              {incompleteTasks.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTaskId(t.id)}
                  className={`px-4 py-2 rounded-full border ${selectedTaskId === t.id ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                >
                  <Text className={`text-xs font-bold ${selectedTaskId === t.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} numberOfLines={1}>
                    {t.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 font-medium">Currently Focusing On</Text>
            <Text className="text-sm text-gray-900 dark:text-white font-bold" numberOfLines={1}>
              {currentTask?.title ?? 'Free Focus Session'}
            </Text>
          </View>
        )}
      </View>

      {/* Mode Tabs */}
      {isIdle && (
        <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-full p-1 mb-8">
          {(Object.keys(MODE_LABELS) as CycleMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setCycleMode(m)}
              className={`px-4 py-2 rounded-full ${cycleMode === m ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${cycleMode === m ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500'}`}>
                {`${MODE_LABELS[m]} (${POMODORO_CONFIG[m]}m)`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Focus Ring timer display */}
      <View className="items-center justify-center mb-10 relative">
        <FocusRing
          progress={progress}
          size={240}
          strokeWidth={12}
          color={ringColor}
          backgroundColor={ringBg}
        >
          <Text className="text-gray-900 dark:text-white text-5xl font-thin tracking-widest" style={{ fontVariant: ['tabular-nums'] }}>
            {formatTime(isIdle ? POMODORO_CONFIG[cycleMode] * 60 : timeLeft)}
          </Text>
          <Text className="text-gray-500 text-xs mt-2 uppercase tracking-widest">
            {isRunning ? 'running' : isPaused ? 'paused' : 'ready'}
          </Text>
        </FocusRing>
      </View>

      {/* Controls */}
      <View className="flex-row items-center gap-6 mt-4">
        {/* Stop */}
        {(isRunning || isPaused) && (
          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center shadow-sm"
            onPress={handleStop}
          >
            <Ionicons name="stop" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}

        {/* Primary – Start / Pause / Resume */}
        <TouchableOpacity
          className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
          style={{ backgroundColor: ringColor }}
          onPress={isIdle ? handleStart : isRunning ? handlePause : handleResume}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={28}
            color="white"
          />
        </TouchableOpacity>

        {/* Skip to next */}
        {(isRunning || isPaused) && (
          <TouchableOpacity
            className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center shadow-sm"
            onPress={handleSessionComplete}
          >
            <Ionicons name="play-skip-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Streak/Sessions info */}
      <View className="flex-row gap-4 mt-12 w-full px-4">
        <View className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 items-center shadow-sm">
          <Text className="text-blue-500 dark:text-blue-400 font-bold text-xl">{sessionsCompleted}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Sessions Completed</Text>
        </View>
        <View className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 items-center shadow-sm">
          <Text className="text-blue-500 dark:text-blue-400 font-bold text-xl">{`${sessionsCompleted * POMODORO_CONFIG.focus}m`}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Total Focus Time</Text>
        </View>
      </View>
    </View>
  );
}
