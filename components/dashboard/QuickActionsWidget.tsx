import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  TextInput, KeyboardAvoidingView, Platform, Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../store/taskStore';
import { useFocusStore } from '../../store/focusStore';
import { useSettingsStore } from '../../store/settingsStore';
import { AIService } from '../../services/ai/AIService';
import { ActionExecutor } from '../../services/ai/ActionExecutor';

// ─── AI Chat Modal ────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const AI_SUGGESTIONS = [
  'Plan my day',
  'What tasks are overdue?',
  'Give me a focus tip',
  'What should I work on first?',
];

function AIChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "👋 Hi! I'm your AI productivity assistant. Ask me to help plan your day, prioritize tasks, or suggest a focus strategy.",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const tasks = useTaskStore((s) => s.tasks);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const apiKey = geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    // 1. Add user message
    const userMsg: ChatMessage = { role: 'user', text: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsAiThinking(true);

    try {
      // 2. Process message using the modular AI Service
      const result = await AIService.processMessage(msgText, apiKey, tasks);

      // 3. Execute actions (e.g. ADD_TASK, COMPLETE_TASK, etc.)
      if (result.actions && result.actions.length > 0) {
        await ActionExecutor.execute(result.actions, onClose);
      }

      // 4. Haptic feedback
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      // 5. Append AI message
      setMessages((prev) => [...prev, { role: 'ai', text: result.message }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: '⚠️ Sorry, I encountered an error processing that request. Please make sure your API key is valid or try again.',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-950">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b border-gray-800">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-indigo-500/20 items-center justify-center">
              <Ionicons name="sparkles" size={18} color="#818cf8" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">AI Assistant</Text>
              <Text className="text-gray-500 text-xs">
                {apiKey.startsWith('sk-or-') ? 'OpenRouter Live' : (geminiApiKey ? 'Gemini Live' : 'Local NLP Fallback')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {messages.map((msg, i) => (
            <View
              key={i}
              className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 rounded-br-sm'
                    : 'bg-gray-800 rounded-bl-sm'
                }`}
              >
                <Text className="text-white text-sm leading-5">{msg.text}</Text>
              </View>
            </View>
          ))}

          {isAiThinking && (
            <View className="mb-4 items-start">
              <View className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#818cf8" />
                <Text className="text-gray-400 text-sm">Thinking...</Text>
              </View>
            </View>
          )}

          {/* Quick suggestions */}
          {messages.length === 1 && !isAiThinking && (
            <View className="mt-2">
              <Text className="text-gray-500 text-xs mb-3 font-medium">Try asking:</Text>
              <View className="flex-row flex-wrap gap-2">
                {AI_SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSend(s)}
                    className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5"
                  >
                    <Text className="text-gray-300 text-xs">{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="flex-row items-end gap-3 px-5 py-4 border-t border-gray-800">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#6b7280"
            multiline
            maxLength={300}
            className="flex-1 bg-gray-800 rounded-2xl px-4 py-3 text-white text-sm max-h-24"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isAiThinking}
            className={`w-11 h-11 rounded-full items-center justify-center ${input.trim() && !isAiThinking ? 'bg-indigo-500' : 'bg-gray-800'}`}
          >
            <Ionicons name="arrow-up" size={18} color={input.trim() && !isAiThinking ? 'white' : '#4b5563'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  backgroundColor: string;
}

function ActionButton({ label, icon, onPress, backgroundColor }: ActionButtonProps) {
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
    } catch (e) {}
    onPress();
  };

  return (
    <TouchableOpacity
      className="items-center mr-4"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.75}
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
export function QuickActionsWidget() {
  const [aiVisible, setAiVisible] = useState(false);
  const tasks = useTaskStore((s) => s.tasks);
  const incompleteTasks = tasks.filter((t) => !t.completed && !t.deleted && !t.archived);

  // Navigate to focus screen — if there are tasks, use the first incomplete one.
  // Otherwise start a free-form focus session on the full SQLite-backed focus page.
  const handleFocus = () => {
    if (incompleteTasks.length > 0) {
      router.push(`/focus/${incompleteTasks[0].id}` as any);
    } else {
      router.push('/focus/free' as any);
    }
  };

  return (
    <>
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row py-1">
            <ActionButton
              label="+ Task"
              icon="add"
              backgroundColor="#3b82f6"
              onPress={() => router.push('/add' as any)}
            />
            <ActionButton
              label="Calendar"
              icon="calendar"
              backgroundColor="#8b5cf6"
              onPress={() => router.push('/(tabs)/calendar' as any)}
            />
            <ActionButton
              label="Focus"
              icon="timer-outline"
              backgroundColor="#ef4444"
              onPress={handleFocus}
            />
            <ActionButton
              label="Habits"
              icon="leaf-outline"
              backgroundColor="#10b981"
              onPress={() => router.push('/(tabs)/habits' as any)}
            />
            <ActionButton
              label="AI"
              icon="sparkles-outline"
              backgroundColor="#6366f1"
              onPress={() => setAiVisible(true)}
            />
          </View>
        </ScrollView>
      </View>

      <AIChatModal visible={aiVisible} onClose={() => setAiVisible(false)} />
    </>
  );
}
