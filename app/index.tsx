import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Button } from '../components/ui/Button';
import { TaskCard } from '../components/task/TaskCard';
import { useTaskStore, FilterType, SortType } from '../store/taskStore';

const FILTERS: FilterType[] = ['All', 'Active', 'Completed'];
const SORTS: SortType[] = ['Newest', 'Priority', 'Alphabetical'];

export default function Home() {
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleComplete);
  const filterBy = useTaskStore((state) => state.filterBy);
  const sortBy = useTaskStore((state) => state.sortBy);
  const setFilter = useTaskStore((state) => state.setFilter);
  const setSort = useTaskStore((state) => state.setSort);

  // Apply filtering
  let displayedTasks = tasks.filter((task) => {
    if (filterBy === 'Active') return !task.isCompleted;
    if (filterBy === 'Completed') return task.isCompleted;
    return true; // 'All'
  });

  // Apply sorting
  displayedTasks = displayedTasks.sort((a, b) => {
    if (sortBy === 'Alphabetical') return a.title.localeCompare(b.title);
    if (sortBy === 'Priority') {
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    // Newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-5">
      
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900">Hello there 👋</Text>
          <Text className="text-gray-500 mt-1">Here are your tasks for today.</Text>
        </View>
        
        {/* Settings Icon (Mock) */}
        <Button 
          title="⚙️" 
          variant="secondary" 
          className="w-12 h-12 rounded-full p-0 bg-gray-200"
          onPress={() => router.push('/settings' as any)} 
        />
      </View>

      {/* Filtering and Sorting Chips */}
      <View className="mb-4 space-y-3 gap-3">
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full border ${
                filterBy === f ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`${filterBy === f ? 'text-white' : 'text-gray-600'} text-sm font-medium`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sorts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {SORTS.map(s => (
            <TouchableOpacity 
              key={s}
              onPress={() => setSort(s)}
              className={`px-4 py-1.5 rounded-full border ${
                sortBy === s ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`${sortBy === s ? 'text-white' : 'text-gray-600'} text-xs font-medium`}>Sort: {s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <View className="flex-1">
        {/* @ts-expect-error React 19 type mismatch for FlashList props */}
        <FlashList
          data={displayedTasks}
          keyExtractor={(item) => item.id}
          estimatedItemSize={76}
          renderItem={({ item }) => (
            <TaskCard 
              task={item} 
              onPress={() => router.push(`/task/${item.id}` as any)}
              onToggleComplete={() => toggleTask(item.id)}
              onDelete={() => useTaskStore.getState().deleteTask(item.id)}
            />
          )}
        />
      </View>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 right-5 w-16 h-16">
        <Button 
          title="+" 
          variant="primary" 
          className="w-full h-full rounded-full shadow-lg shadow-blue-500/50"
          onPress={() => router.push('/add' as any)} 
        />
      </View>

    </View>
  );
}
