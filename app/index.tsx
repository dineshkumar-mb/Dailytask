import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-5">
      <Text className="text-3xl font-bold text-gray-900 mb-8">
        Your Daily Tasks
      </Text>
      
      <View className="w-full my-3">
        <Button 
          title="Add a Task" 
          onPress={() => router.push('/add' as any)} 
          color="#3b82f6"
        />
      </View>

      <View className="w-full my-3">
        <Button 
          title="Settings" 
          onPress={() => router.push('/settings' as any)} 
          color="#64748b"
        />
      </View>
    </View>
  );
}
