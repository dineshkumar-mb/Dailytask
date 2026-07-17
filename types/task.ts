import { z } from 'zod';

export const TaskCategory = z.enum(['Personal', 'Work', 'Shopping', 'Health', 'Study']);
export const TaskPriority = z.enum(['Low', 'Medium', 'High', 'Urgent']);

export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['image', 'pdf', 'audio']),
  uri: z.string(),
  name: z.string(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title cannot be empty').max(100),
  description: z.string().optional(),
  category: TaskCategory.optional(),
  priority: TaskPriority,
  
  dueDate: z.date().optional(),
  reminderDate: z.date().optional(),
  
  estimatedMinutes: z.number().optional(),
  actualMinutes: z.number().optional(),
  
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number(),
  }).optional(),
  
  subtasks: z.array(SubtaskSchema).default([]),
  notes: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  tags: z.array(z.string()).default([]),
  
  completed: z.boolean().default(false),
  archived: z.boolean().default(false),
  deleted: z.boolean().default(false),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type TaskCategoryType = z.infer<typeof TaskCategory>;
export type TaskPriorityType = z.infer<typeof TaskPriority>;

// Schema specifically for the "Add/Edit Form" where ID and dates might not exist yet
export const TaskFormSchema = TaskSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  completed: true, 
  archived: true,
  deleted: true,
  completedAt: true,
});

export type TaskFormData = z.infer<typeof TaskFormSchema>;
