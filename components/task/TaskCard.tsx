import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Task } from '../../types/task';
import { Card } from '../ui/Card';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onPress, onToggleComplete, onDelete }: TaskCardProps) {
  let priorityColor = 'text-green-500 bg-green-100';
  if (task.priority === 'Medium') priorityColor = 'text-orange-500 bg-orange-100';
  if (task.priority === 'High') priorityColor = 'text-red-500 bg-red-100';

  const renderRightActions = () => {
    return (
      <TouchableOpacity 
        onPress={onDelete}
        className="bg-red-500 justify-center items-center w-20 rounded-2xl mb-3 ml-3"
      >
        <Text className="text-white font-bold">Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View 
      entering={FadeInDown.springify().damping(12)}
      exiting={FadeOutUp}
    >
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <TouchableOpacity 
          onPress={onPress} 
          activeOpacity={0.8} 
          className="mb-3"
        >
          <Card className={`flex-row items-center p-4 ${task.isCompleted ? 'opacity-60' : 'opacity-100'}`}>
            
            {/* Checkbox */}
            <TouchableOpacity 
              onPress={onToggleComplete}
              className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center
                ${task.isCompleted ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-transparent'}`}
            >
              {task.isCompleted && <Text className="text-white text-xs font-bold">✓</Text>}
            </TouchableOpacity>

            {/* Task Details */}
            <View className="flex-1">
              <Text 
                className={`text-base font-semibold text-gray-900 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">{task.category}</Text>
            </View>

            {/* Priority Badge */}
            <View className={`px-2 py-1 rounded-md ml-2 ${priorityColor.split(' ')[1]}`}>
              <Text className={`text-xs font-bold ${priorityColor.split(' ')[0]}`}>
                {task.priority}
              </Text>
            </View>

          </Card>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}
