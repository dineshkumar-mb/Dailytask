import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { ResetPasswordSchema, ResetPasswordFormData } from '../types/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      code: '',
      password: '',
    }
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, this might log them in, or send them to login screen
    router.replace('/login');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 px-6 pt-12">
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-gray-500 dark:text-gray-400 font-medium">← Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Create New Password</Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-8">Enter the 6-digit code sent to your email and your new password.</Text>

      <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="6-Digit Code"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.code?.message}
            />
          )}
        />

        <View className="mt-2" />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="New Password"
              placeholder="••••••••"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <View className="mt-6" />

        <Button 
          title="Reset Password" 
          onPress={handleSubmit(onSubmit)} 
          isLoading={isLoading}
        />
      </View>
    </ScrollView>
  );
}
