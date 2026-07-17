import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, AppState, AppStateStatus,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusStore } from '../../store/focusStore';
import { useTaskStore } from '../../store/taskStore';
import { FocusRing } from '../../components/focus/FocusRing';
import { SessionHistory } from '../../components/focus/SessionHistory';
import { FocusRepository, FocusSessionRecord } from '../../repositories/FocusRepository';

// ─── Pomodoro cycle configuration ───
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
  focus: '#7c3aed',       // purple
  short_break: '#059669', // green
  long_break: '#0284c7',  // blue
};

const MODE_RING_BG: Record<CycleMode, string> = {
  focus: '#ede9fe',
  short_break: '#d1fae5',
  long_break: '#e0f2fe',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusScreen() {
  const { id: taskId } = useLocalSearchParams<{ id: string }>();
  const task = useTaskStore((state) => state.tasks.find((t) => t.id === taskId));
  const toggleComplete = useTaskStore((state) => state.toggleComplete);

  const activeSession = useFocusStore((state) => state.activeSession);
  const timeLeft = useFocusStore((state) => state.timeLeft);
  const startSession = useFocusStore((state) => state.startSession);
  const pauseSession = useFocusStore((state) => state.pauseSession);
  const resumeSession = useFocusStore((state) => state.resumeSession);
  const finishSession = useFocusStore((state) => state.finishSession);
  const tick = useFocusStore((state) => state.tick);

  const [cycleMode, setCycleMode] = useState<CycleMode>('focus');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<FocusSessionRecord[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ─── Load history on mount ───
  useEffect(() => {
    loadHistory();
    return () => {
      // Clean up interval on unmount
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const records = await FocusRepository.getRecentSessions(30);
      setSessionHistory(records);
    } catch (e) {
      // Silently handle — DB may not have the table yet until migration
      console.warn('Focus history unavailable:', e);
    }
  };

  // ─── Tick loop — starts/stops with activeSession ───
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);

    if (activeSession && activeSession.status === 'running') {
      tickRef.current = setInterval(() => {
        tick();
      }, 500); // 500ms for smooth display without burning CPU
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
        // App foregrounded — tick will recalculate using absolute timestamp
        tick();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  const handleSessionComplete = useCallback(async () => {
    if (cycleMode === 'focus') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      setShowCompletionModal(true);
      await finishSession('completed');
      await loadHistory();
    } else {
      // Break ended — go back to focus automatically
      await finishSession('completed');
      setCycleMode('focus');
      await loadHistory();
    }
  }, [cycleMode, sessionsCompleted, finishSession]);

  // ─── User actions ───
  const handleStart = () => {
    const minutes = POMODORO_CONFIG[cycleMode];
    startSession(taskId || null, cycleMode, minutes);
    setShowCompletionModal(false);
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
            setShowCompletionModal(false);
            await loadHistory();
          },
        },
      ]
    );
  };

  const handleCompleteTask = () => {
    if (task && !task.completed) {
      toggleComplete(task.id);
    }
    setShowCompletionModal(false);
    Alert.alert('🎉 Task Completed!', `"${task?.title}" has been marked as done.`, [
      { text: 'Great!', onPress: () => router.back() },
    ]);
  };

  const handleNextBreak = async () => {
    setShowCompletionModal(false);
    const nextMode: CycleMode = 
      (sessionsCompleted % POMODORO_CONFIG.sessionsBeforeLongBreak === 0)
        ? 'long_break'
        : 'short_break';
    setCycleMode(nextMode);
    const minutes = POMODORO_CONFIG[nextMode];
    startSession(taskId || null, nextMode, minutes);
  };

  const handleStartAnother = () => {
    setShowCompletionModal(false);
    setCycleMode('focus');
    const minutes = POMODORO_CONFIG['focus'];
    startSession(taskId || null, 'focus', minutes);
  };

  // ─── Derived display values ───
  const isRunning = !!activeSession && activeSession.status === 'running';
  const isPaused = !!activeSession && activeSession.status === 'paused';
  const isIdle = !activeSession;

  const plannedSeconds = activeSession?.plannedSeconds ?? (POMODORO_CONFIG[cycleMode] * 60);
  const progress = isIdle ? 0 : Math.max(0, 1 - (timeLeft / plannedSeconds));

  const ringColor = MODE_COLORS[cycleMode];
  const ringBg = MODE_RING_BG[cycleMode];

  const todayFocusSeconds = sessionHistory
    .filter(s => {
      const d = new Date(s.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString() && s.type === 'focus' && s.status === 'completed';
    })
    .reduce((acc, s) => acc + s.actualSeconds, 0);

  const todayFocusMins = Math.round(todayFocusSeconds / 60);

  // ─── Completion Modal Overlay ───
  if (showCompletionModal) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-8">
        <StatusBar style="light" />
        <View className="bg-gray-800 rounded-3xl p-8 w-full items-center border border-gray-700">
          <Text className="text-5xl mb-4">🎉</Text>
          <Text className="text-white text-2xl font-bold mb-2 text-center">Focus session complete!</Text>
          <Text className="text-gray-400 text-center mb-8">
            {sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''} completed today
          </Text>

          <TouchableOpacity
            className="w-full bg-purple-600 rounded-2xl p-4 items-center mb-3"
            onPress={handleCompleteTask}
          >
            <Text className="text-white font-bold text-base">✅ Complete Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-gray-700 rounded-2xl p-4 items-center mb-3"
            onPress={handleStartAnother}
          >
            <Text className="text-white font-bold text-base">▶ Start Another Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-green-800/50 rounded-2xl p-4 items-center"
            onPress={handleNextBreak}
          >
            <Text className="text-green-300 font-bold text-base">☕ Take a Break</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Main Focus Screen ───
  return (
    <View className="flex-1 bg-gray-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          onPress={() => {
            if (isRunning || isPaused) {
              handleStop();
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#9ca3af" />
        </TouchableOpacity>

        <Text className="text-gray-400 font-semibold tracking-widest text-xs uppercase">
          {MODE_LABELS[cycleMode]}
        </Text>

        {/* Sessions counter */}
        <View className="flex-row gap-1.5">
          {Array.from({ length: POMODORO_CONFIG.sessionsBeforeLongBreak }).map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i < (sessionsCompleted % POMODORO_CONFIG.sessionsBeforeLongBreak) ? 'bg-purple-400' : 'bg-gray-700'}`}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Task title */}
        <Text
          className="text-white text-xl font-bold text-center mt-4 mb-2 px-8"
          numberOfLines={2}
        >
          {task?.title ?? 'Free Focus Session'}
        </Text>
        <Text className="text-gray-500 text-sm mb-10">
          Today's focus: {todayFocusMins} min
        </Text>

        {/* Focus Ring */}
        <FocusRing
          progress={progress}
          size={260}
          strokeWidth={14}
          color={ringColor}
          backgroundColor={ringBg}
        >
          <Text className="text-white text-5xl font-thin tracking-widest" style={{ fontVariant: ['tabular-nums'] }}>
            {formatTime(isIdle ? POMODORO_CONFIG[cycleMode] * 60 : timeLeft)}
          </Text>
          <Text className="text-gray-500 text-xs mt-2 uppercase tracking-widest">
            {isRunning ? 'running' : isPaused ? 'paused' : 'ready'}
          </Text>
        </FocusRing>

        {/* Pomodoro mode tabs */}
        {isIdle && (
          <View className="flex-row bg-gray-900 rounded-2xl p-1 mt-10 mx-6">
            {(Object.keys(MODE_LABELS) as CycleMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                className={`flex-1 py-2.5 rounded-xl items-center ${cycleMode === mode ? 'bg-gray-700' : ''}`}
                onPress={() => setCycleMode(mode)}
              >
                <Text className={`text-xs font-bold ${cycleMode === mode ? 'text-white' : 'text-gray-500'}`}>
                  {MODE_LABELS[mode]}
                </Text>
                <Text className={`text-[10px] mt-0.5 ${cycleMode === mode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {POMODORO_CONFIG[mode]}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Controls */}
        <View className="flex-row items-center gap-6 mt-10">
          {/* Stop */}
          {(isRunning || isPaused) && (
            <TouchableOpacity
              className="w-14 h-14 rounded-full bg-gray-800 items-center justify-center"
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
              className="w-14 h-14 rounded-full bg-gray-800 items-center justify-center"
              onPress={handleSessionComplete}
            >
              <Ionicons name="play-skip-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Today's Stats strip */}
        <View className="flex-row gap-4 mt-12 mx-6">
          <View className="flex-1 bg-gray-900 rounded-2xl p-4 items-center">
            <Text className="text-purple-400 font-bold text-xl">{sessionsCompleted}</Text>
            <Text className="text-gray-500 text-xs mt-1">Sessions</Text>
          </View>
          <View className="flex-1 bg-gray-900 rounded-2xl p-4 items-center">
            <Text className="text-purple-400 font-bold text-xl">{todayFocusMins}m</Text>
            <Text className="text-gray-500 text-xs mt-1">Focus Today</Text>
          </View>
          <View className="flex-1 bg-gray-900 rounded-2xl p-4 items-center">
            <Text className="text-purple-400 font-bold text-xl">{POMODORO_CONFIG.focus}m</Text>
            <Text className="text-gray-500 text-xs mt-1">Session</Text>
          </View>
        </View>

        {/* Session History */}
        <SessionHistory sessions={sessionHistory} />
      </ScrollView>
    </View>
  );
}
