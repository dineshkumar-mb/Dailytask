import React from 'react';
import { View, Text, Switch, Platform, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, ReminderOffset } from '../../store/settingsStore';

const OFFSET_OPTIONS: { label: string; value: ReminderOffset }[] = [
  { label: '10 min', value: 10 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1 day', value: 1440 },
];

interface RowProps {
  label: string;
  sublabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  rightElement: React.ReactNode;
}

function SettingRow({ label, sublabel, icon, iconColor, rightElement }: RowProps) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-8 h-8 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: iconColor + '20' }}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 dark:text-white font-medium text-sm">{label}</Text>
          {sublabel && <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{sublabel}</Text>}
        </View>
      </View>
      {rightElement}
    </View>
  );
}

export function NotificationSettingsSection() {
  const prefs = useSettingsStore((s) => s.notifications);
  const setPref = useSettingsStore((s) => s.setNotificationPreference);

  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mx-0 border border-amber-200 dark:border-amber-700/50">
        <View className="flex-row items-center gap-2">
          <Ionicons name="information-circle" size={18} color="#d97706" />
          <Text className="text-amber-700 dark:text-amber-300 font-medium text-sm">
            Notifications are available on iOS and Android only.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 border border-gray-100 dark:border-gray-700 shadow-sm">
      {/* Task Reminders */}
      <SettingRow
        label="Task Reminders"
        sublabel="Get notified before tasks are due"
        icon="alarm-outline"
        iconColor="#3b82f6"
        rightElement={
          <Switch
            value={prefs.taskRemindersEnabled}
            onValueChange={(v) => setPref('taskRemindersEnabled', v)}
            trackColor={{ true: '#3b82f6' }}
          />
        }
      />

      {/* Reminder Offset */}
      {prefs.taskRemindersEnabled && (
        <View className="pb-4 pt-1">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2 ml-11">Remind me before due date:</Text>
          <View className="flex-row gap-2 ml-11">
            {OFFSET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPref('reminderOffsetMinutes', opt.value)}
                className={`px-3 py-1.5 rounded-xl border ${
                  prefs.reminderOffsetMinutes === opt.value
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                <Text className={`text-xs font-bold ${prefs.reminderOffsetMinutes === opt.value ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Focus Notifications */}
      <SettingRow
        label="Focus Notifications"
        sublabel="Alert when a session or break ends"
        icon="timer-outline"
        iconColor="#7c3aed"
        rightElement={
          <Switch
            value={prefs.focusNotificationsEnabled}
            onValueChange={(v) => setPref('focusNotificationsEnabled', v)}
            trackColor={{ true: '#7c3aed' }}
          />
        }
      />

      {/* Morning Planner */}
      <SettingRow
        label="Morning Planner"
        sublabel={prefs.morningPlannerEnabled ? `Daily at ${prefs.morningPlannerHour}:${String(prefs.morningPlannerMinute).padStart(2, '0')}` : 'Plan your day each morning'}
        icon="sunny-outline"
        iconColor="#f59e0b"
        rightElement={
          <Switch
            value={prefs.morningPlannerEnabled}
            onValueChange={(v) => setPref('morningPlannerEnabled', v)}
            trackColor={{ true: '#f59e0b' }}
          />
        }
      />

      {/* Evening Review */}
      <SettingRow
        label="Evening Review"
        sublabel={prefs.eveningReviewEnabled ? `Daily at ${prefs.eveningReviewHour}:${String(prefs.eveningReviewMinute).padStart(2, '0')}` : 'Review your progress each evening'}
        icon="moon-outline"
        iconColor="#6366f1"
        rightElement={
          <Switch
            value={prefs.eveningReviewEnabled}
            onValueChange={(v) => setPref('eveningReviewEnabled', v)}
            trackColor={{ true: '#6366f1' }}
          />
        }
      />
    </View>
  );
}
