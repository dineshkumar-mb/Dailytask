import React from 'react';
import { View, Text } from 'react-native';
import { FocusSessionRecord } from '../../repositories/FocusRepository';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/taskStore';

interface SessionHistoryProps {
  sessions: FocusSessionRecord[];
}

// Quick helper to group by relative date names
function getRelativeDateName(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  
  if (dateStr.startsWith(fmt(today))) return 'Today';
  if (dateStr.startsWith(fmt(yesterday))) return 'Yesterday';
  
  // Return day of week if within last 7 days, else full date
  const d = new Date(dateStr);
  const diffTime = Math.abs(today.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  const tasks = useTaskStore((state) => state.tasks);
  
  if (sessions.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-gray-400 dark:text-gray-500">No recent focus sessions.</Text>
      </View>
    );
  }

  // Group sessions
  const groups: Record<string, FocusSessionRecord[]> = {};
  sessions.forEach(s => {
    // Note: createdAt is a Date object from the DB query (Drizzle timestamp)
    const dateObj = new Date(s.createdAt);
    const dateStr = dateObj.toISOString();
    const groupName = getRelativeDateName(dateStr);
    
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(s);
  });

  return (
    <View className="mt-8 mb-10 w-full px-5">
      <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Session History</Text>
      
      {Object.entries(groups).map(([groupName, groupSessions]) => (
        <View key={groupName} className="mb-5">
          <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            {groupName}
          </Text>
          
          <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {groupSessions.map((session, index) => {
              const task = tasks.find(t => t.id === session.taskId);
              const taskName = task?.title || 'General Focus';
              const durationMins = Math.round(session.actualSeconds / 60);
              const isLast = index === groupSessions.length - 1;
              
              return (
                <View 
                  key={session.id} 
                  className={`flex-row items-center justify-between p-4 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${session.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <Ionicons 
                        name={session.status === 'completed' ? 'checkmark' : 'close'} 
                        size={16} 
                        color={session.status === 'completed' ? '#10b981' : '#ef4444'} 
                      />
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="text-gray-900 dark:text-white font-medium truncate" numberOfLines={1}>
                        {taskName}
                      </Text>
                      <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5 capitalize">
                        {session.status}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {durationMins} min
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
