// @ts-nocheck
import { DashboardService } from '../services/DashboardService';
import { FocusService, ActiveSession } from '../services/FocusService';
import { CalendarService } from '../services/CalendarService';
import { AIService } from '../services/ai/AIService';
import { Task } from '../types/task';

// Simple Assertion Helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('🤖 Running Infrastructure Unit Tests...\n');

// ─── Test 1: DashboardService ──────────────────────────────────────────────────
console.log('🧪 Testing DashboardService.computeMetrics...');
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task Completed Today',
    priority: 'High',
    completed: true,
    completedAt: new Date(), // completed today
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    syncStatus: 'LOCAL',
    version: 1
  },
  {
    id: '2',
    title: 'Task Overdue',
    priority: 'High',
    completed: false,
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // due yesterday
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    syncStatus: 'LOCAL',
    version: 1
  },
  {
    id: '3',
    title: 'Task Due Today',
    priority: 'Medium',
    completed: false,
    dueDate: new Date(), // due today
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    syncStatus: 'LOCAL',
    version: 1
  },
  {
    id: '4',
    title: 'Task Due Tomorrow',
    priority: 'Low',
    completed: false,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // due tomorrow
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    syncStatus: 'LOCAL',
    version: 1
  }
];

const metrics = DashboardService.computeMetrics(mockTasks);
assert(metrics.completedTodayCount === 1, `Expected completedTodayCount to be 1, got ${metrics.completedTodayCount}`);
assert(metrics.todayTasks.length === 1, `Expected 1 task due today, got ${metrics.todayTasks.length}`);
assert(metrics.overdueTasks.length === 1, `Expected 1 overdue task, got ${metrics.overdueTasks.length}`);
assert(metrics.upcomingTasks.length === 1, `Expected 1 upcoming task, got ${metrics.upcomingTasks.length}`);
console.log('✅ DashboardService.computeMetrics passed!');

// ─── Test 2: FocusService ──────────────────────────────────────────────────────
console.log('\n🧪 Testing FocusService.getRemainingSeconds...');
const now = Date.now();

// Scenario A: Session is running, 10 seconds has elapsed since start
const sessionRunning: ActiveSession = {
  id: 'session-1',
  taskId: 'task-1',
  type: 'focus',
  plannedSeconds: 1500, // 25 minutes
  startedAt: now - 10000, // started 10 seconds ago
  accumulatedSeconds: 0,
  status: 'running'
};
const remainingRunning = FocusService.getRemainingSeconds(sessionRunning);
assert(remainingRunning === 1490, `Expected remaining seconds to be 1490, got ${remainingRunning}`);

// Scenario B: Session is paused, has accumulated 20 seconds
const sessionPaused: ActiveSession = {
  id: 'session-2',
  taskId: 'task-1',
  type: 'focus',
  plannedSeconds: 1500,
  startedAt: now,
  accumulatedSeconds: 20,
  status: 'paused'
};
const remainingPaused = FocusService.getRemainingSeconds(sessionPaused);
assert(remainingPaused === 1480, `Expected remaining seconds to be 1480, got ${remainingPaused}`);
console.log('✅ FocusService.getRemainingSeconds passed!');

// ─── Test 3: CalendarService ───────────────────────────────────────────────────
console.log('\n🧪 Testing CalendarService...');
const todayStr = CalendarService.formatDate(new Date());
const marked = CalendarService.getMarkedDates(mockTasks, todayStr);
assert(marked[todayStr] !== undefined, 'Expected today date to be marked in calendar');
assert(marked[todayStr].selected === true, 'Expected today date to be selected');
console.log('✅ CalendarService passed!');

// ─── Test 4: AIService & Offline Provider ──────────────────────────────────────
console.log('\n🧪 Testing AIService and Offline NLP provider...');
const offlineProvider = AIService.getProvider(undefined);
assert(offlineProvider.constructor.name === 'OfflineProvider', 'Expected OfflineProvider when key is undefined');

// Test ADD_TASK command offline parsing
const testAddCommand = async () => {
  const res = await offlineProvider.processMessage('add task Water the plants', mockTasks);
  assert(res.actions !== undefined && res.actions.length === 1, 'Expected 1 action');
  assert(res.actions![0].type === 'ADD_TASK', 'Expected ADD_TASK action');
  assert(res.actions![0].payload.title === 'Water the plants', 'Expected correct task title');
};

// Test COMPLETE_TASK command offline parsing
const testCompleteCommand = async () => {
  const res = await offlineProvider.processMessage('complete task Task Due Today', mockTasks);
  assert(res.actions !== undefined && res.actions.length === 1, 'Expected 1 action');
  assert(res.actions![0].type === 'COMPLETE_TASK', 'Expected COMPLETE_TASK action');
  assert(res.actions![0].payload.taskId === '3', 'Expected matching task ID 3');
};

Promise.all([testAddCommand(), testCompleteCommand()]).then(() => {
  console.log('✅ AIService and Offline NLP provider passed!');
  console.log('\n🎉 ALL INFRASTRUCTURE UNIT TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ AI Tests Failed:', err);
  process.exit(1);
});
