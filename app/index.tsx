import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Home() {
  return (
    <View className="flex-1 justify-center bg-gray-50 p-5">
      
      <Card className="items-center p-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Daily Tasks
        </Text>
        <Text className="text-gray-500 mb-8 text-center">
          Master your day, one task at a time.
        </Text>
        
        <View className="w-full gap-4">
          <Button 
            title="Add a Task" 
            onPress={() => router.push('/add' as any)} 
            variant="primary"
          />

          <Button 
            title="Settings" 
            onPress={() => router.push('/settings' as any)} 
            variant="secondary"
          />
        </View>
      </Card>

    </View>
  );
}
