import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-1">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full h-12 bg-white dark:bg-gray-800 rounded-xl px-4 border ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
        } focus:border-blue-500 text-gray-900 dark:text-white ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
