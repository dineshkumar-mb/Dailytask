import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SignupSchema, SignupFormData } from '../types/auth';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logger } from '../services/Logger';

// ─── Password strength indicator ─────────────────────────────────────────────

type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong';

function getPasswordStrength(password: string): { level: StrengthLevel; score: number; label: string } {
  if (!password) return { level: 'weak', score: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', score: 1, label: 'Weak' };
  if (score === 2) return { level: 'fair', score: 2, label: 'Fair' };
  if (score === 3) return { level: 'strong', score: 3, label: 'Strong' };
  return { level: 'very-strong', score: 4, label: 'Very Strong' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { level, score, label } = getPasswordStrength(password);
  if (!password) return null;

  const barColors: Record<StrengthLevel, string> = {
    weak: '#ef4444',
    fair: '#f97316',
    strong: '#22c55e',
    'very-strong': '#10b981',
  };
  const textColors: Record<StrengthLevel, string> = {
    weak: 'text-red-500',
    fair: 'text-orange-500',
    strong: 'text-green-500',
    'very-strong': 'text-emerald-500',
  };
  const color = barColors[level];
  const segments = [1, 2, 3, 4];

  return (
    <View className="mb-4">
      <View className="flex-row gap-1 mb-1">
        {segments.map((s) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: s <= score ? color : '#e5e7eb',
            }}
          />
        ))}
      </View>
      <Text className={`text-xs font-medium ${textColors[level]}`}>{label}</Text>
    </View>
  );
}

// ─── Requirement Row ──────────────────────────────────────────────────────────

function Requirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 mb-1">
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={met ? '#22c55e' : '#9ca3af'}
      />
      <Text className={`text-xs ${met ? 'text-green-500' : 'text-gray-400'}`}>{label}</Text>
    </View>
  );
}

// ─── Signup Screen ────────────────────────────────────────────────────────────

export default function Signup() {
  const signup = useAuthStore((state) => state.signup);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const watchedPassword = watch('password');

  // Password requirement checks
  const reqs = {
    length: watchedPassword.length >= 8,
    uppercase: /[A-Z]/.test(watchedPassword),
    number: /[0-9]/.test(watchedPassword),
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      await signup(data);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
      router.replace('/');
    } catch (error) {
      Logger.error('[SignupScreen] Signup failed.', error);
      setServerError('Something went wrong. Please try again.');
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch (_) {}
    }
  };

  const isBusy = isLoading || isSubmitting;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-md shadow-blue-500/30">
            <Ionicons name="checkmark-done" size={32} color="white" />
          </View>
          <Text className="text-4xl font-extrabold text-blue-600 dark:text-blue-500 mb-1">
            DailyTask
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center">
            Your personal productivity companion
          </Text>
        </View>

        {/* Card */}
        <View className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Text
            className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
            accessibilityRole="header"
          >
            Create account
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Join thousands organizing their day smarter.
          </Text>

          {/* Server-level error banner */}
          {serverError && (
            <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 text-sm flex-1">{serverError}</Text>
            </View>
          )}

          {/* Full name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
                accessibilityLabel="Full name input"
              />
            )}
          />

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
                accessibilityLabel="Email address input"
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <View className="relative">
                  <Input
                    label="Password"
                    placeholder="Min. 8 characters"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    accessibilityLabel="Password input"
                  />
                  <TouchableOpacity
                    className="absolute right-3 bottom-7"
                    onPress={() => setShowPassword((p) => !p)}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                <PasswordStrengthBar password={value} />
                {value.length > 0 && (
                  <View className="mb-4 -mt-2 px-1">
                    <Requirement met={reqs.length} label="At least 8 characters" />
                    <Requirement met={reqs.uppercase} label="One uppercase letter" />
                    <Requirement met={reqs.number} label="One number" />
                  </View>
                )}
              </View>
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="relative">
                <Input
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                  accessibilityLabel="Confirm password input"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
                <TouchableOpacity
                  className="absolute right-3 bottom-7"
                  onPress={() => setShowConfirm((p) => !p)}
                  accessibilityLabel={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Terms note */}
          <Text className="text-gray-400 dark:text-gray-500 text-xs text-center mb-5 leading-relaxed">
            By creating an account, you agree to our{' '}
            <Text className="text-blue-500 font-medium">Terms of Service</Text>
            {' '}and{' '}
            <Text className="text-blue-500 font-medium">Privacy Policy</Text>.
          </Text>

          {/* CTA */}
          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            isLoading={isBusy}
            accessibilityLabel="Create account button"
          />
        </View>

        {/* Sign in link */}
        <View className="flex-row justify-center items-center mt-6 gap-1">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/login' as any)}
            accessibilityLabel="Go to sign in"
            accessibilityRole="button"
          >
            <Text className="text-blue-500 font-semibold text-sm"> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
