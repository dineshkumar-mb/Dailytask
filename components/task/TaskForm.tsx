import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { TaskFormSchema, TaskFormData, TaskCategoryType, TaskPriorityType } from '../../types/task';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const CATEGORIES: TaskCategoryType[] = ['Personal', 'Work', 'Shopping', 'Health', 'Study'];
const PRIORITIES: TaskPriorityType[] = ['Low', 'Medium', 'High'];

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
    }
  });

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

      {/* Submit Button */}
      <Button 
        title={submitLabel} 
        onPress={handleSubmit(handleFormSubmit)} 
        className="mt-4 mb-10"
      />
    </View>
  );
}
