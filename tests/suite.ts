import { DashboardService } from '../services/DashboardService';
import { FocusService, ActiveSession } from '../services/FocusService';
import { CalendarService } from '../services/CalendarService';
import { AIService } from '../services/ai/AIService';
import { validateAIResponse } from '../services/ai/ActionExecutor';
import { Task } from '../types/task';

// ─── Simple Assertion Helper ───────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

function assertThrows(fn: () => void, message: string): void {
  try {
    fn();
    console.error(`❌ Expected throw but none occurred: ${message}`);
    process.exit(1);
  } catch (_) {
    // expected
  }
}

console.log('🤖 Running Infrastructure Unit Tests...\n');

// ─── Mock Tasks ────────────────────────────────────────────────────────────────

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task Completed Today',
    priority: 'High',
    completed: true,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    subtasks: [],
    tags: [],
  },
  {
    id: '2',
    title: 'Task Overdue',
    priority: 'High',
    completed: false,
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    subtasks: [],
    tags: [],
  },
  {
    id: '3',
    title: 'Task Due Today',
    priority: 'Medium',
    completed: false,
    dueDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    subtasks: [],
    tags: [],
  },
  {
    id: '4',
    title: 'Task Due Tomorrow',
    priority: 'Low',
    completed: false,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    archived: false,
    deleted: false,
    subtasks: [],
    tags: [],
  },
];

// ─── Test 1: DashboardService ──────────────────────────────────────────────────

console.log('🧪 Test 1: DashboardService.computeMetrics...');
const metrics = DashboardService.computeMetrics(mockTasks);
assert(metrics.completedTodayCount === 1, `Expected completedTodayCount=1, got ${metrics.completedTodayCount}`);
assert(metrics.todayTasks.length === 1, `Expected 1 task due today, got ${metrics.todayTasks.length}`);
assert(metrics.overdueTasks.length === 1, `Expected 1 overdue task, got ${metrics.overdueTasks.length}`);
assert(metrics.upcomingTasks.length === 1, `Expected 1 upcoming task, got ${metrics.upcomingTasks.length}`);
console.log('✅ DashboardService.computeMetrics passed!\n');

// ─── Test 2: FocusService ──────────────────────────────────────────────────────

console.log('🧪 Test 2: FocusService.getRemainingSeconds...');
const now = Date.now();

const sessionRunning: ActiveSession = {
  id: 'session-1',
  taskId: 'task-1',
  type: 'focus',
  plannedSeconds: 1500,
  startedAt: now - 10000,
  accumulatedSeconds: 0,
  status: 'running',
};
const remainingRunning = FocusService.getRemainingSeconds(sessionRunning);
assert(remainingRunning === 1490, `Expected 1490, got ${remainingRunning}`);

const sessionPaused: ActiveSession = {
  id: 'session-2',
  taskId: 'task-1',
  type: 'focus',
  plannedSeconds: 1500,
  startedAt: now,
  accumulatedSeconds: 20,
  status: 'paused',
};
const remainingPaused = FocusService.getRemainingSeconds(sessionPaused);
assert(remainingPaused === 1480, `Expected 1480, got ${remainingPaused}`);
console.log('✅ FocusService.getRemainingSeconds passed!\n');

// ─── Test 3: CalendarService ───────────────────────────────────────────────────

console.log('🧪 Test 3: CalendarService...');
const todayStr = CalendarService.formatDate(new Date());
const marked = CalendarService.getMarkedDates(mockTasks, todayStr);
assert(marked[todayStr] !== undefined, 'Expected today to be marked in calendar');
assert(marked[todayStr].selected === true, 'Expected today to be selected');
console.log('✅ CalendarService passed!\n');

// ─── Test 4: AIService & Offline Provider ──────────────────────────────────────

console.log('🧪 Test 4: AIService provider selection...');
const offlineProvider = AIService.getProvider(undefined);
assert(offlineProvider.constructor.name === 'OfflineProvider', 'Expected OfflineProvider when key is undefined');

const openRouterProvider = AIService.getProvider('sk-or-testkey');
assert(openRouterProvider.constructor.name === 'OpenRouterProvider', 'Expected OpenRouterProvider for sk-or- key');

const geminiProvider = AIService.getProvider('AIza-testkey');
assert(geminiProvider.constructor.name === 'GeminiProvider', 'Expected GeminiProvider for non-openrouter key');
console.log('✅ AIService provider selection passed!\n');

// ─── Test 5: OfflineProvider NLP Commands ─────────────────────────────────────

console.log('🧪 Test 5: OfflineProvider NLP command parsing...');

const testOfflineNLP = async () => {
  // ADD_TASK
  const addRes = await offlineProvider.processMessage('add task Water the plants', mockTasks);
  assert(Array.isArray(addRes.actions) && addRes.actions!.length === 1, 'Expected 1 action for ADD_TASK');
  assert(addRes.actions![0].type === 'ADD_TASK', 'Expected ADD_TASK action type');
  assert(addRes.actions![0].payload.title === 'Water the plants', `Expected "Water the plants", got "${addRes.actions![0].payload.title}"`);

  // COMPLETE_TASK
  const completeRes = await offlineProvider.processMessage('complete task Task Due Today', mockTasks);
  assert(Array.isArray(completeRes.actions) && completeRes.actions!.length === 1, 'Expected 1 action for COMPLETE_TASK');
  assert(completeRes.actions![0].type === 'COMPLETE_TASK', 'Expected COMPLETE_TASK action type');
  assert(completeRes.actions![0].payload.taskId === '3', `Expected taskId "3", got "${completeRes.actions![0].payload.taskId}"`);

  // Unknown task — no action expected
  const noMatchRes = await offlineProvider.processMessage('complete task NonExistentTask', mockTasks);
  assert(!noMatchRes.actions || noMatchRes.actions.length === 0, 'Expected no actions for unrecognized task');
};

// ─── Test 6: validateAIResponse schema guard ───────────────────────────────────

console.log('🧪 Test 6: validateAIResponse schema validation...');

// Valid response — no actions
const validNoActions = { message: 'Hello there!' };
assert(validateAIResponse(validNoActions), 'Expected valid response with message only');

// Valid response — with actions
const validWithActions = {
  message: 'Done!',
  actions: [{ type: 'ADD_TASK', payload: { title: 'Test', priority: 'Medium', dueDate: null } }],
};
assert(validateAIResponse(validWithActions), 'Expected valid response with ADD_TASK action');

// Invalid — missing message
const missingMessage = { actions: [] };
assert(!validateAIResponse(missingMessage), 'Expected invalid response with missing message');

// Invalid — message is not a string
const badMessage = { message: 42 };
assert(!validateAIResponse(badMessage), 'Expected invalid response with non-string message');

// Invalid — empty message
const emptyMessage = { message: '' };
assert(!validateAIResponse(emptyMessage), 'Expected invalid response with empty message');

// Invalid — unknown action type
const badActionType = {
  message: 'OK',
  actions: [{ type: 'HACK_SYSTEM', payload: {} }],
};
assert(!validateAIResponse(badActionType), 'Expected invalid response with unknown action type');

// Invalid — actions not an array
const actionsNotArray = { message: 'OK', actions: 'not-an-array' };
assert(!validateAIResponse(actionsNotArray), 'Expected invalid response with non-array actions');

// Invalid — null
assert(!validateAIResponse(null), 'Expected invalid for null');
assert(!validateAIResponse(undefined), 'Expected invalid for undefined');

console.log('✅ validateAIResponse schema validation passed!\n');

// ─── Run Async Tests ───────────────────────────────────────────────────────────

Promise.all([testOfflineNLP()]).then(() => {
  console.log('✅ OfflineProvider NLP parsing passed!\n');
  console.log('🎉 ALL INFRASTRUCTURE UNIT TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Tests Failed:', err);
  process.exit(1);
});
