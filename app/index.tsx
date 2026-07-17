import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TaskCard } from '../components/task/TaskCard';
import { DailyProgressCard } from '../components/task/DailyProgressCard';
import { useTaskStore, FilterType, SortType, CategoryFilterType } from '../store/taskStore';
import { TaskCategoryType } from '../types/task';
import { useAuthStore } from '../store/authStore';

const CATEGORIES: CategoryFilterType[] = ['All', 'Personal', 'Work', 'Shopping', 'Health', 'Study'];
const FILTERS: FilterType[] = ['All', 'Active', 'Completed'];
const SORTS: SortType[] = ['Newest', 'Priority', 'Alphabetical'];

export default function Home() {
  const userName = useAuthStore((state) => state.userName);
  const tasks = useTaskStore((state) => state.tasks);
  const toggleTask = useTaskStore((state) => state.toggleComplete);
  const filterBy = useTaskStore((state) => state.filterBy);
  const sortBy = useTaskStore((state) => state.sortBy);
  const categoryFilter = useTaskStore((state) => state.categoryFilter);
  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setFilter = useTaskStore((state) => state.setFilter);
  const setSort = useTaskStore((state) => state.setSort);
  const setCategoryFilter = useTaskStore((state) => state.setCategoryFilter);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);
  const clearCompletedTasks = useTaskStore((state) => state.clearCompletedTasks);

  // Apply filtering
  let displayedTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (categoryFilter !== 'All' && task.category !== categoryFilter) {
      return false;
    }
    
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
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 pt-12 px-5">
      
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Hello, {userName || 'there'} 👋</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Here are your tasks for today.</Text>
        </View>
        
        {/* Settings Icon */}
        <TouchableOpacity 
          className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 items-center justify-center shadow-sm"
          onPress={() => router.push('/settings' as any)}
        >
          {/* We'd normally use colorScheme to pass a color here, but let's rely on NativeWind's text utility if possible. Since we're using Ionicons color prop, we need the raw value. */}
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Daily Progress Dashboard */}
      <DailyProgressCard tasks={tasks} />

      {/* Search Bar */}
      <View className="mb-2">
        <Input 
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-white dark:bg-gray-800 mb-2"
        />
      </View>

      {/* Filtering and Sorting Chips */}
      <View className="mb-5 mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 items-center py-1">
            {FILTERS.map((f) => {
              const isActive = filterBy === f;
              return (
                <TouchableOpacity 
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`px-5 py-2 rounded-2xl ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-500/20' 
                      : 'bg-gray-100 dark:bg-gray-800/60'
                  }`}
                >
                  <Text className={`${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'} text-[13px] tracking-wide`}>{f}</Text>
                </TouchableOpacity>
              );
            })}

            <View className="w-[2px] h-6 bg-gray-200 dark:bg-gray-700 mx-2 rounded-full" />

            {SORTS.map((s) => {
              const isActive = sortBy === s;
              return (
                <TouchableOpacity 
                  key={s}
                  onPress={() => setSort(s)}
                  className={`px-5 py-2 rounded-2xl flex-row items-center gap-1.5 ${
                    isActive 
                      ? 'bg-purple-100 dark:bg-purple-500/20' 
                      : 'bg-gray-100 dark:bg-gray-800/60'
                  }`}
                >
                  {isActive && <Ionicons name="swap-vertical" size={14} color="#a855f7" />}
                  <Text className={`${isActive ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'} text-[13px] tracking-wide`}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Category Chips */}
      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 items-center py-1">
            {CATEGORIES.map((cat) => {
              const isActive = categoryFilter === cat;
              return (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-xl ${
                    isActive 
                      ? 'bg-gray-800 dark:bg-gray-700' 
                      : 'bg-gray-100 dark:bg-gray-800/60'
                  }`}
                >
                  <Text className={`${isActive ? 'text-white font-bold' : 'text-gray-500 dark:text-gray-400 font-medium'} text-[12px]`}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Clear Completed Action */}
      {filterBy === 'Completed' && (
        <View className="flex-row justify-end mb-3">
          <TouchableOpacity 
            onPress={clearCompletedTasks}
            className="bg-red-100 dark:bg-red-500/20 px-4 py-2 rounded-full flex-row items-center gap-1.5"
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text className="text-red-500 font-bold text-xs tracking-wide">Clear All Completed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <View className="flex-1">
        <FlatList
          data={displayedTasks}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
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
