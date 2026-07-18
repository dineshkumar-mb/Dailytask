import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Logger } from '../../services/Logger';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Go to home screen or reload
    try {
      router.replace('/(tabs)' as any);
    } catch (e) {}
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center px-6">
          <View className="items-center mb-8">
            <Text className="text-6xl mb-4">💥</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Oops! Something went wrong.
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 px-4">
              An unexpected crash occurred in the application view rendering.
            </Text>
            
            {this.state.error && (
              <ScrollView className="max-h-40 w-full bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-8 border border-gray-200 dark:border-gray-700">
                <Text className="text-xs text-red-500 font-mono">
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.error.stack && (
                  <Text className="text-[10px] text-gray-400 font-mono mt-2">
                    {this.state.error.stack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity 
              onPress={this.handleReset}
              className="w-full bg-blue-500 rounded-2xl p-4 items-center justify-center shadow-sm"
            >
              <Text className="text-white font-bold text-base">Reload Application</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
