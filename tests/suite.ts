import { DashboardService } from '../services/DashboardService';
import { FocusService, ActiveSession } from '../services/FocusService';
import { CalendarService } from '../services/CalendarService';
import { AIService } from '../services/ai/AIService';
import { validateAIResponse } from '../services/ai/ActionExecutor';
import { VectorStore } from '../services/ai/VectorStore';
import { MemoryValidator } from '../services/ai/MemoryValidator';
import { Planner } from '../services/ai/Planner';
import { ToolRegistry } from '../services/ai/ToolRegistry';
import { Task } from '../types/task';

// ─── Simple Assertion Helper ───────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
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

// ─── Test 4: VectorStore Cosine Similarity ────────────────────────────────────

console.log('🧪 Test 4: VectorStore Cosine Similarity & Search...');
const vs = new VectorStore();
const vecA = [1.0, 0.0, 0.0];
const vecB = [1.0, 0.0, 0.0];
const vecC = [0.0, 1.0, 0.0];

const simIdentical = VectorStore.cosineSimilarity(vecA, vecB);
assert(Math.abs(simIdentical - 1.0) < 0.001, `Expected cosine similarity 1.0, got ${simIdentical}`);

const simOrthogonal = VectorStore.cosineSimilarity(vecA, vecC);
assert(Math.abs(simOrthogonal - 0.0) < 0.001, `Expected cosine similarity 0.0, got ${simOrthogonal}`);

vs.add('doc1', vecA);
vs.add('doc2', vecC);

const searchRes = vs.search(vecA, 2);
assert(searchRes.length === 2, `Expected 2 search results, got ${searchRes.length}`);
assert(searchRes[0].id === 'doc1', `Expected top result 'doc1', got '${searchRes[0].id}'`);
console.log('✅ VectorStore passed!\n');

// ─── Test 5: MemoryValidator ───────────────────────────────────────────────────

console.log('🧪 Test 5: MemoryValidator duplicate & temporary rejection...');
const existingMemories = [
  {
    id: 'm1',
    content: 'User prefers working in the morning',
    type: 'preference' as const,
    importance: 1.0,
    accessCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Valid candidate
const validResult = MemoryValidator.validate(
  { content: 'User wants to learn Rust programming', type: 'goal' },
  existingMemories
);
assert(validResult.isValid === true, 'Expected candidate to be valid');

// Reject temporary fact
const tempResult = MemoryValidator.validate(
  { content: 'User is going shopping today', type: 'fact' },
  existingMemories
);
assert(tempResult.isValid === false, 'Expected candidate with "today" to be rejected');

// Reject duplicate
const dupResult = MemoryValidator.validate(
  { content: 'User prefers working in the morning', type: 'preference' },
  existingMemories
);
assert(dupResult.isValid === false, 'Expected exact text duplicate to be rejected');
console.log('✅ MemoryValidator passed!\n');

// ─── Test 6: Planner Route Classification ─────────────────────────────────────

console.log('🧪 Test 6: Planner query classification...');
const planGreeting = Planner.plan('Hello!');
assert(planGreeting.route === 'SIMPLE_REPLY', 'Expected greeting to route to SIMPLE_REPLY');

const planAction = Planner.plan('add task Buy groceries');
assert(planAction.route === 'AGENT_LOOP', 'Expected "add task" to route to AGENT_LOOP');
console.log('✅ Planner passed!\n');

// ─── Test 7: ToolRegistry Registration & Execution ────────────────────────────

console.log('🧪 Test 7: ToolRegistry plugin registration...');
AIService.initTools();
const tools = ToolRegistry.getAll();
assert(tools.length >= 5, `Expected at least 5 registered tools, got ${tools.length}`);
assert(ToolRegistry.has('create_task'), 'Expected create_task tool to be registered');
assert(ToolRegistry.has('remember_fact'), 'Expected remember_fact tool to be registered');
console.log('✅ ToolRegistry passed!\n');

// ─── Test 8: validateAIResponse schema guard ───────────────────────────────────

console.log('🧪 Test 8: validateAIResponse schema validation...');
assert(validateAIResponse({ message: 'Hello!' }), 'Expected valid response');
assert(!validateAIResponse({ message: 42 }), 'Expected invalid for non-string message');
assert(!validateAIResponse(null), 'Expected invalid for null');
console.log('✅ validateAIResponse schema validation passed!\n');

// ─── Run Async Tests ───────────────────────────────────────────────────────────

const testOfflineNLP = async () => {
  const offlineProvider = AIService.getProvider(undefined);
  const addRes = await offlineProvider.processMessage('add task Water the plants', mockTasks);
  assert(Array.isArray(addRes.actions) && addRes.actions!.length === 1, 'Expected 1 action for ADD_TASK');
  assert(addRes.actions![0].type === 'ADD_TASK', 'Expected ADD_TASK action type');
};

Promise.all([testOfflineNLP()]).then(() => {
  console.log('✅ OfflineProvider NLP parsing passed!\n');
  console.log('🎉 ALL INFRASTRUCTURE UNIT TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ Tests Failed:', err);
  process.exit(1);
});
