import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/taskStore';
import { Button } from '../../components/ui/Button';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function TaskDetails() {
  const { id } = useLocalSearchParams();
  const tasks = useTaskStore((state) => state.tasks);
  const updateTask = useTaskStore((state) => state.updateTask);
  const task = tasks.find((t) => t.id === id);

  const [newSubtask, setNewSubtask] = useState('');
  const [notes, setNotes] = useState(task?.notes || '');

  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
    }
  }, [task?.notes]);

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 p-5">
        <Text className="text-gray-500 dark:text-gray-400">Task not found!</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: uuidv4(),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date(),
    };
    updateTask(task.id, { subtasks: [...(task.subtasks || []), subtask] });
    setNewSubtask('');
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = (task.subtasks || []).map(s => 
      s.id === subId ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date() : undefined } : s
    );
    updateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = (task.subtasks || []).filter(s => s.id !== subId);
    updateTask(task.id, { subtasks: updated });
  };

  const handleSaveNotes = () => {
    if (notes !== task.notes) {
      updateTask(task.id, { notes });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 p-5 pt-10">
        
        {/* Title & Meta */}
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{task.title}</Text>
        
        <View className="flex-row flex-wrap gap-2 mb-6">
          <View className="bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-full">
            <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">{task.category}</Text>
          </View>
          <View className="bg-gray-200 dark:bg-gray-800 px-3 py-1.5 rounded-full">
            <Text className="text-gray-700 dark:text-gray-300 font-bold text-xs">{task.priority}</Text>
          </View>
          {task.dueDate && (
            <View className="bg-red-100 dark:bg-red-500/20 px-3 py-1.5 rounded-full">
              <Text className="text-red-600 dark:text-red-400 font-bold text-xs">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {task.reminderDate && (
            <View className="bg-purple-100 dark:bg-purple-500/20 px-3 py-1.5 rounded-full flex-row items-center gap-1">
              <Ionicons name="notifications" size={12} color="#9333ea" />
              <Text className="text-purple-600 dark:text-purple-400 font-bold text-xs">
                {new Date(task.reminderDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
          )}
        </View>

        {/* Focus Mode Button – flagship premium CTA */}
        <TouchableOpacity
          onPress={() => router.push(`/focus/${task.id}` as any)}
          className="rounded-2xl p-4 flex-row items-center justify-center mb-6 shadow-lg"
          style={{ backgroundColor: '#7c3aed' }}
        >
          <Ionicons name="timer-outline" size={22} color="white" />
          <Text className="text-white font-bold text-base ml-2 tracking-wide">⚡ Start Focus Session</Text>
        </TouchableOpacity>

        {/* Subtasks */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Subtasks</Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          {(task.subtasks || []).map((sub) => (
            <View key={sub.id} className="flex-row items-center mb-3">
              <TouchableOpacity 
                onPress={() => handleToggleSubtask(sub.id)} 
                className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${sub.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}
              >
                {sub.completed && <Text className="text-white font-bold text-xs">✓</Text>}
              </TouchableOpacity>
              <Text className={`flex-1 font-medium ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                {sub.title}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteSubtask(sub.id)} className="p-1">
                <Ionicons name="close" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ))}
          
          <View className="flex-row items-center mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            <TextInput
              value={newSubtask}
              onChangeText={setNewSubtask}
              placeholder="Add new subtask..."
              placeholderTextColor="#9ca3af"
              className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-3 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
              onSubmitEditing={handleAddSubtask}
            />
            <TouchableOpacity onPress={handleAddSubtask} className="bg-blue-500 w-12 h-12 ml-2 rounded-xl items-center justify-center">
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          onBlur={handleSaveNotes}
          multiline
          numberOfLines={6}
          placeholder="Add task notes here..."
          placeholderTextColor="#9ca3af"
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6 text-gray-900 dark:text-white min-h-[120px] shadow-sm leading-6"
          style={{ textAlignVertical: 'top' }}
        />

        {/* Actions */}
        <View className="gap-3 mb-10">
          <Button title="Edit Details" onPress={() => router.push(`/edit/${task.id}` as any)} variant="primary" />
          <Button 
            title="Archive Task" 
            onPress={() => {
              updateTask(task.id, { archived: true });
              router.back();
            }} 
            variant="secondary" 
          />
          <Button 
            title="Delete Task" 
            onPress={() => {
              // Soft delete by setting deleted: true
              updateTask(task.id, { deleted: true, archived: false });
              router.back();
            }} 
            variant="danger" 
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
