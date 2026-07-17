import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Card } from '../ui/Card';
import { useDashboardStore } from '../../store/dashboardStore';

export function ProgressWidget() {
  const metrics = useDashboardStore((state) => state.metrics);
  const score = metrics?.productivityScore || 0;
  
  // Animate the score number smoothly
  const animatedScore = useSharedValue(0);
  
  useEffect(() => {
    animatedScore.value = withTiming(score, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  // Segmented circular progress (10 segments)
  const segments = 10;
  const activeSegments = Math.round((score / 100) * segments);

  return (
    <Card className="mb-6 p-5 bg-gradient-to-br from-blue-500 to-indigo-600 border-0">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-white/80 font-semibold text-sm tracking-widest uppercase mb-1">
            Productivity Score
          </Text>
          <View className="flex-row items-end">
            <Text className="text-white text-4xl font-extrabold">{score}</Text>
            <Text className="text-white/70 text-lg font-bold ml-1 mb-1">/ 100</Text>
          </View>
        </View>
        <View className="bg-white/20 px-3 py-1.5 rounded-full">
          <Text className="text-white font-bold text-xs">
            {metrics?.completionPercentage || 0}% Done
          </Text>
        </View>
      </View>

      {/* Segmented Circle Progress */}
      <View className="flex-row gap-2 justify-between">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <Animated.View 
              key={i}
              className={`flex-1 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-white/30'}`}
            />
          );
        })}
      </View>
    </Card>
  );
}
