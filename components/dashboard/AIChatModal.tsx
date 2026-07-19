import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTaskStore } from '../../store/taskStore';
import { useSettingsStore } from '../../store/settingsStore';
import { AIService } from '../../services/ai/AIService';
import { ActionExecutor, validateAIResponse } from '../../services/ai/ActionExecutor';
import { Logger } from '../../services/Logger';
import { ChatMessage as AIChatMessage } from '../../services/ai/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  usedMemory?: boolean;
  fromCache?: boolean;
  toolsExecuted?: string[];
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial-0',
  role: 'ai',
  text: "👋 Hi! I'm your AI productivity assistant. Ask me to help plan your day, prioritize tasks, or suggest a focus strategy.",
};

const AI_SUGGESTIONS = [
  'Plan my day',
  'What tasks are overdue?',
  'Give me a focus tip',
  'What should I work on first?',
];

// ─── AI Chat Modal ────────────────────────────────────────────────────────────

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const tasks = useTaskStore((s) => s.tasks);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const apiKey = useMemo(
    () => geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
    [geminiApiKey]
  );

  const providerLabel = useMemo(() => {
    if (apiKey?.startsWith('sk-or-')) return 'OpenRouter Live';
    if (geminiApiKey) return 'Gemini Live';
    return 'Local NLP Fallback';
  }, [apiKey, geminiApiKey]);

  // Auto-scroll to the latest message whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Reset messages when modal is re-opened
  useEffect(() => {
    if (visible) {
      setMessages([INITIAL_MESSAGE]);
      setInput('');
    }
  }, [visible]);

  const handleSend = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isAiThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msgText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsAiThinking(true);

    try {
      const historyPayload: AIChatMessage[] = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const rawResult = await AIService.processMessage(msgText, apiKey, tasks, historyPayload);

      // Validate AI response before executing any actions
      if (!validateAIResponse(rawResult)) {
        throw new Error('AI response failed schema validation.');
      }

      if (rawResult.actions && rawResult.actions.length > 0) {
        await ActionExecutor.execute(rawResult.actions, onClose);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: rawResult.message,
          usedMemory: rawResult.usedMemory,
          fromCache: rawResult.fromCache,
          toolsExecuted: rawResult.toolCallsExecuted,
        },
      ]);
    } catch (error) {
      Logger.error('[AIChatModal] Failed to process AI message.', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'ai',
          text: '⚠️ Sorry, I encountered an error processing that request. Please check your API key or try again.',
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  }, [input, apiKey, tasks, messages, onClose, isAiThinking]);

  const isSendDisabled = !input.trim() || isAiThinking;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-950"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b border-gray-800">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-indigo-500/20 items-center justify-center">
              <Ionicons name="sparkles" size={18} color="#818cf8" />
            </View>
            <View>
              <Text className="text-white font-bold text-base" accessibilityRole="header">
                AI Assistant
              </Text>
              <Text className="text-gray-500 text-xs">{providerLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center"
            accessibilityLabel="Close AI Assistant"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5 py-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              accessible
              accessibilityLabel={`${msg.role === 'user' ? 'You' : 'AI'}: ${msg.text}`}
            >
              <View
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 rounded-br-sm'
                    : 'bg-gray-800 rounded-bl-sm'
                }`}
              >
                <Text className="text-white text-sm leading-5">{msg.text}</Text>

                {/* Sub-indicators */}
                {(msg.usedMemory || msg.fromCache || (msg.toolsExecuted && msg.toolsExecuted.length > 0)) && (
                  <View className="flex-row flex-wrap gap-2 mt-2 pt-2 border-t border-gray-700/50">
                    {msg.usedMemory && (
                      <View className="flex-row items-center gap-1 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                        <Ionicons name="bulb-outline" size={10} color="#818cf8" />
                        <Text className="text-indigo-300 text-[10px]">Memory Context</Text>
                      </View>
                    )}
                    {msg.fromCache && (
                      <View className="flex-row items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <Ionicons name="flash-outline" size={10} color="#34d399" />
                        <Text className="text-emerald-300 text-[10px]">Cached Response</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}

          {isAiThinking && (
            <View className="mb-4 items-start" accessibilityLabel="AI is thinking">
              <View className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#818cf8" />
                <Text className="text-gray-400 text-sm">Reasoning & Executing...</Text>
              </View>
            </View>
          )}

          {/* Quick suggestions — only shown at the start */}
          {messages.length === 1 && !isAiThinking && (
            <View className="mt-2">
              <Text className="text-gray-500 text-xs mb-3 font-medium">Try asking:</Text>
              <View className="flex-row flex-wrap gap-2">
                {AI_SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSend(s)}
                    className="bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5"
                    accessibilityLabel={`Suggestion: ${s}`}
                    accessibilityRole="button"
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
            returnKeyType="send"
            accessibilityLabel="Message input"
            accessibilityHint="Type a message and press send"
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={isSendDisabled}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              !isSendDisabled ? 'bg-indigo-500' : 'bg-gray-800'
            }`}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            accessibilityState={{ disabled: isSendDisabled }}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={!isSendDisabled ? 'white' : '#4b5563'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
