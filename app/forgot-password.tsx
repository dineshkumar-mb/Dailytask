import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { ForgotPasswordSchema, ForgotPasswordFormData } from '../types/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/reset-password' as any);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 px-6 pt-12">
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className="text-gray-500 dark:text-gray-400 font-medium">← Back to Login</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Reset Password</Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-8">Enter your email address and we'll send you a recovery code.</Text>

      <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <View className="mt-6" />

        <Button 
          title="Send Recovery Link" 
          onPress={handleSubmit(onSubmit)} 
          isLoading={isLoading}
        />
      </View>
    </ScrollView>
  );
}
