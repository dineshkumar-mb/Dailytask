import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function TaskDetails() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-900 mb-4">
        Task Details for ID: {id}
      </Text>
      
      <Button 
        title="Go Back" 
        onPress={() => router.back()} 
        color="#64748b"
      />
    </View>
  );
}
