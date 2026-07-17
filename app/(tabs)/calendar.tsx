import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from '../../components/task/TaskCard';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

export default function CalendarScreen() {
  const tasks = useTaskStore(state => state.tasks);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Map tasks to dates for the calendar markers
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Add selected date styling
    marks[selectedDate] = { selected: true, selectedColor: '#3b82f6', disableTouchEvent: true };

    // Add dots for days with tasks
    tasks.forEach(task => {
      if (task.dueDate && !task.deleted && !task.archived) {
        // Simple YYYY-MM-DD format (local timezone)
        const dateString = new Date(task.dueDate.getTime() - (task.dueDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        if (!marks[dateString]) {
          marks[dateString] = { marked: true, dotColor: '#3b82f6' };
        } else if (dateString !== selectedDate) {
          // If it's already in the marks (e.g. from selectedDate), append dot
          marks[dateString].marked = true;
          marks[dateString].dotColor = '#3b82f6';
        }
      }
    });

    return marks;
  }, [tasks, selectedDate]);

  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.dueDate || task.deleted || task.archived) return false;
      const taskDate = new Date(task.dueDate.getTime() - (task.dueDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      return taskDate === selectedDate;
    });
  }, [tasks, selectedDate]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-12 px-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Calendar</Text>
      
      <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm mb-6">
        <Calendar
          current={selectedDate}
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            calendarBackground: isDark ? '#1f2937' : '#ffffff',
            textSectionTitleColor: isDark ? '#9ca3af' : '#6b7280',
            selectedDayBackgroundColor: '#3b82f6',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3b82f6',
            dayTextColor: isDark ? '#e5e7eb' : '#111827',
            textDisabledColor: isDark ? '#4b5563' : '#d1d5db',
            dotColor: '#3b82f6',
            selectedDotColor: '#ffffff',
            arrowColor: '#3b82f6',
            monthTextColor: isDark ? '#ffffff' : '#111827',
          }}
        />
      </View>

      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Tasks due on {selectedDate}
        </Text>
        
        {filteredTasks.length === 0 ? (
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-500 dark:text-gray-400">No tasks due on this date.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mb-3">
                <TaskCard 
                  task={item}
                  onPress={() => router.push(`/task/${item.id}`)}
                />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
