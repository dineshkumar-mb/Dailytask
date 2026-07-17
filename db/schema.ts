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
