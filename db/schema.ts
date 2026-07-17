import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Tasks ---
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  categoryId: text('category_id'),
  priority: text('priority').notNull().default('Medium'),
  
  dueDate: integer('due_date', { mode: 'timestamp' }),
  reminderDate: integer('reminder_date', { mode: 'timestamp' }),
  
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),
  
  recurrenceFrequency: text('recurrence_frequency'), // 'daily', 'weekly', etc.
  recurrenceInterval: integer('recurrence_interval'),
  
  notes: text('notes'),
  
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  
  // Cloud Sync Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'), // LOCAL, SYNCING, SYNCED, FAILED
  deviceId: text('device_id'),
});

// --- Subtasks ---
export const subtasks = sqliteTable('subtasks', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  
  // Cloud Sync Metadata
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
});

// --- Categories ---
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  
  // Cloud Sync Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
});

// --- Tags ---
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  
  // Cloud Sync Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
});

// --- Task Tags (Many-to-Many Junction) ---
export const taskTags = sqliteTable('task_tags', {
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

// --- Attachments ---
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image', 'pdf', 'audio'
  uri: text('uri').notNull(),
  name: text('name').notNull(),
  
  // Cloud Sync Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
});

// --- Focus Sessions ---
export const focusSessions = sqliteTable('focus_sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // 'focus' | 'short_break' | 'long_break'
  plannedSeconds: integer('planned_seconds').notNull(),
  actualSeconds: integer('actual_seconds').notNull().default(0),
  status: text('status').notNull(), // 'completed' | 'interrupted' | 'cancelled'
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  
  // Cloud Sync Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  version: integer('version').notNull().default(1),
  syncStatus: text('sync_status').notNull().default('LOCAL'),
});

// --- Notifications ---
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(), // maps to expo-notifications identifier
  type: text('type').notNull(), // 'task_reminder'|'focus_complete'|'break_complete'|'daily_plan'|'daily_review'|'weekly_summary'
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('scheduled'), // 'scheduled'|'triggered'|'cancelled'
  payload: text('payload'), // JSON: { title, body, data }
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});
