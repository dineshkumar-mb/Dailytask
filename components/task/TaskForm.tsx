import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { useColorScheme } from 'nativewind';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { TaskFormSchema, TaskFormData, TaskCategoryType, TaskPriorityType } from '../../types/task';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const CATEGORIES: TaskCategoryType[] = ['Personal', 'Work', 'Shopping', 'Health', 'Study'];
const PRIORITIES: TaskPriorityType[] = ['Low', 'Medium', 'High', 'Urgent'];

interface TaskFormProps {
  defaultValues?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  submitLabel: string;
}

export function TaskForm({ defaultValues, onSubmit, submitLabel }: TaskFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      category: defaultValues?.category || 'Personal',
      priority: defaultValues?.priority || 'Medium',
      dueDate: defaultValues?.dueDate,
      reminderDate: defaultValues?.reminderDate,
    }
  });

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const handleFormSubmit = (data: TaskFormData) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(data);
  };

  return (
    <View>
      {/* Title Input */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Task Title"
            placeholder="What needs to be done?"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.title?.message}
          />
        )}
      />

      {/* Category Selection */}
      <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 mt-4">Category</Text>
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => onChange(cat)}
                className={`px-4 py-2 rounded-full border ${
                  value === cat ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                }`}
              >
                <Text className={`${value === cat ? 'text-white' : 'text-gray-700 dark:text-gray-300'} font-medium`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Priority Selection */}
      <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 mt-2">Priority</Text>
      <Controller
        control={control}
        name="priority"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row gap-3 mb-8">
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri}
                onPress={() => onChange(pri)}
                className={`flex-1 items-center py-3 rounded-xl border ${
                  value === pri ? 'bg-gray-800 dark:bg-gray-700 border-gray-800 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                }`}
              >
                <Text className={`${value === pri ? 'text-white' : 'text-gray-700 dark:text-gray-300'} font-bold`}>
                  {pri}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Due Date & Time */}
      <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 mt-2">Due Date & Time</Text>
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row gap-3 mb-4">
            {Platform.OS === 'web' ? (
              <>
                <input
                  type="date"
                  value={value ? value.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newDate = val ? new Date(val) : new Date();
                    if (value) {
                      newDate.setHours(value.getHours(), value.getMinutes());
                    }
                    onChange(val ? newDate : undefined);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#ffffff' : '#111827',
                  }}
                />
                <input
                  type="time"
                  value={value ? value.toTimeString().substring(0, 5) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [hours, minutes] = val.split(':').map(Number);
                      const newDate = value ? new Date(value) : new Date();
                      newDate.setHours(hours, minutes);
                      onChange(newDate);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#ffffff' : '#111827',
                  }}
                />
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowDueDatePicker(true)}
                  className="flex-1 px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                >
                  <Text className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                    {value ? value.toLocaleDateString() : "Select Date"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setShowDueTimePicker(true)}
                  className="flex-1 px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                >
                  <Text className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                    {value ? value.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Select Time"}
                  </Text>
                </TouchableOpacity>

                {showDueDatePicker && (
                  <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDueDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        if (value) {
                          selectedDate.setHours(value.getHours(), value.getMinutes());
                        }
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
                
                {showDueTimePicker && (
                  <DateTimePicker
                    value={value || new Date()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDueTimePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        if (value) {
                          selectedDate.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
                        }
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
          </View>
        )}
      />

      {/* Reminder Time */}
      <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 mt-2">Reminder</Text>
      <Controller
        control={control}
        name="reminderDate"
        render={({ field: { onChange, value } }) => (
          <View className="mb-8">
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={value ? new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange(val ? new Date(val) : undefined);
                }}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: isDark ? '#4b5563' : '#d1d5db',
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  color: isDark ? '#ffffff' : '#111827',
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowReminderPicker(true)}
                  className="px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                >
                  <Text className={value ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                    {value ? value.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'}) : "Set a reminder (Optional)"}
                  </Text>
                </TouchableOpacity>

                {showReminderPicker && (
                  <DateTimePicker
                    value={value || new Date()}
                    mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowReminderPicker(Platform.OS === 'ios');
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </>
            )}
          </View>
        )}
      />

      {/* Submit Button */}
      <Button 
        title={submitLabel} 
        onPress={handleSubmit(handleFormSubmit)} 
        className="mt-4 mb-10"
      />
    </View>
  );
}
