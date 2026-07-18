import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { LoginSchema, LoginFormData } from '../types/auth';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900 px-6 pt-20">
      <View className="mb-10 items-center">
        <Text className="text-4xl font-extrabold text-blue-600 dark:text-blue-500 mb-2">DailyTask</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">Organize your life, perfectly.</Text>
      </View>

      <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome back</Text>

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

        <View className="mt-2" />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <TouchableOpacity 
          className="self-end mt-2 mb-6"
          onPress={() => router.push('/forgot-password' as any)}
        >
          <Text className="text-blue-500 font-medium">Forgot password?</Text>
        </TouchableOpacity>

        <Button 
          title="Sign In" 
          onPress={handleSubmit(onSubmit)} 
          isLoading={isLoading}
        />
      </View>

      {/* Sign up link */}
      <View className="flex-row justify-center items-center mt-6 gap-1">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">Don't have an account?</Text>
        <TouchableOpacity
          onPress={() => router.push('/signup' as any)}
          accessibilityLabel="Create a new account"
          accessibilityRole="button"
        >
          <Text className="text-blue-500 font-semibold text-sm"> Create account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
