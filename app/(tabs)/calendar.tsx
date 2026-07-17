import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import { useTaskStore } from '../../store/taskStore';
import { useCalendarStore } from '../../store/calendarStore';
import { CalendarService } from '../../services/CalendarService';
import { TaskCard } from '../../components/task/TaskCard';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CalendarScreen() {
  const tasks = useTaskStore(state => state.tasks);
  const selectedDate = useCalendarStore(state => state.selectedDate);
  const setSelectedDate = useCalendarStore(state => state.setSelectedDate);
  const setViewMode = useCalendarStore(state => state.setViewMode);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [rescheduleTaskId, setRescheduleTaskId] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Map tasks to dates for marked calendar dots using the service
  const markedDates = useMemo(() => {
    return CalendarService.getMarkedDates(tasks, selectedDate);
  }, [tasks, selectedDate]);

  // Filter tasks for the selected date using the service
  const filteredTasks = useMemo(() => {
    return CalendarService.getTasksForDate(tasks, selectedDate);
  }, [tasks, selectedDate]);

  // Filter unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.dueDate && !task.deleted && !task.archived);
  }, [tasks]);

  const handleQuickReschedule = async (option: 'today' | 'tomorrow' | 'nextWeek' | 'clear') => {
    if (!rescheduleTaskId) return;

    let targetDateStr: string | null = null;
    const today = new Date();

    if (option === 'today') {
      targetDateStr = CalendarService.formatDate(today);
    } else if (option === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      targetDateStr = CalendarService.formatDate(tomorrow);
    } else if (option === 'nextWeek') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      targetDateStr = CalendarService.formatDate(nextWeek);
    } // 'clear' leaves it as null to remove the due date

    await CalendarService.rescheduleTask(rescheduleTaskId, targetDateStr);
    setRescheduleTaskId(null);
  };

  const handleRescheduleSave = async (dateStr: string) => {
    if (!rescheduleTaskId) return;
    await CalendarService.rescheduleTask(rescheduleTaskId, dateStr);
    setRescheduleTaskId(null);
  };

  const toggleTask = useTaskStore((state) => state.toggleComplete);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-12">
      <CalendarProvider
        date={selectedDate}
        onDateChanged={(date) => setSelectedDate(date)}
        showTodayButton
        theme={{
          todayButtonTextColor: '#3b82f6',
        }}
      >
        <View className="px-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Calendar</Text>
        </View>

        <View className="bg-white dark:bg-gray-800 shadow-sm mb-6 border-b border-gray-100 dark:border-gray-700">
          <ExpandableCalendar
            firstDay={1}
            markedDates={markedDates}
            onCalendarToggled={(isOpen) => setViewMode(isOpen ? 'month' : 'week')}
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

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Tasks due on {selectedDate}
          </Text>
          
          {filteredTasks.length === 0 ? (
            <View className="items-center justify-center py-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">No tasks due on this date.</Text>
            </View>
          ) : (
            filteredTasks.map(item => (
              <View key={item.id} className="mb-1">
                <TaskCard 
                  task={item}
                  onPress={() => router.push(`/task/${item.id}`)}
                  onToggleComplete={() => toggleTask(item.id)}
                  onReschedule={() => setRescheduleTaskId(item.id)}
                />
              </View>
            ))
          )}

          {unscheduledTasks.length > 0 && (
            <View className="mt-8 mb-10">
              <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Unscheduled Tasks
              </Text>
              {unscheduledTasks.map(item => (
                <View key={item.id} className="mb-1">
                  <TaskCard 
                    task={item}
                    onPress={() => router.push(`/task/${item.id}`)}
                    onToggleComplete={() => toggleTask(item.id)}
                    onReschedule={() => setRescheduleTaskId(item.id)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </CalendarProvider>

      {/* Quick Reschedule Menu Overlay */}
      {rescheduleTaskId && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center z-50 p-5">
          <View className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reschedule Task</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Choose a new due date for "{tasks.find(t => t.id === rescheduleTaskId)?.title}"
            </Text>
            
            {/* Quick Options */}
            <View className="gap-2 mb-4">
              <TouchableOpacity 
                onPress={() => handleQuickReschedule('today')}
                className="w-full bg-blue-50 dark:bg-blue-900/20 py-3.5 rounded-2xl items-center border border-blue-100 dark:border-blue-800/40"
              >
                <Text className="text-blue-600 dark:text-blue-400 font-semibold">Today</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleQuickReschedule('tomorrow')}
                className="w-full bg-purple-50 dark:bg-purple-900/20 py-3.5 rounded-2xl items-center border border-purple-100 dark:border-purple-800/40"
              >
                <Text className="text-purple-600 dark:text-purple-400 font-semibold">Tomorrow</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleQuickReschedule('nextWeek')}
                className="w-full bg-indigo-50 dark:bg-indigo-900/20 py-3.5 rounded-2xl items-center border border-indigo-100 dark:border-indigo-800/40"
              >
                <Text className="text-indigo-600 dark:text-indigo-400 font-semibold">Next Week</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleQuickReschedule('clear')}
                className="w-full bg-red-50 dark:bg-red-950/20 py-3.5 rounded-2xl items-center border border-red-100 dark:border-red-900/30"
              >
                <Text className="text-red-600 dark:text-red-400 font-semibold">Clear Due Date</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Date Picker Trigger */}
            <TouchableOpacity 
              onPress={() => setShowCustomPicker(true)}
              className="w-full bg-gray-100 dark:bg-gray-700 py-3.5 rounded-2xl items-center mb-6"
            >
              <Text className="text-gray-700 dark:text-gray-200 font-semibold">Pick Custom Date...</Text>
            </TouchableOpacity>

            {showCustomPicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowCustomPicker(false);
                  if (date) {
                    const dateStr = CalendarService.formatDate(date);
                    handleRescheduleSave(dateStr);
                  }
                }}
              />
            )}

            {/* Cancel Button */}
            <TouchableOpacity 
              onPress={() => setRescheduleTaskId(null)}
              className="w-full bg-gray-200 dark:bg-gray-600 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-gray-800 dark:text-white font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
