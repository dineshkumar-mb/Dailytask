import { z } from 'zod';

// Define the exact literal categories and priorities our app allows
export const TaskCategory = z.enum(['Personal', 'Work', 'Shopping', 'Health', 'Study']);
export const TaskPriority = z.enum(['Low', 'Medium', 'High']);

// Create the Zod Schema for validation
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title is too long (max 100 characters)'),
  category: TaskCategory,
  priority: TaskPriority,
  dueDate: z.date().optional(), // Due date is optional
  isCompleted: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  createdAt: z.date(),
});

// Create the TypeScript type automatically from the Zod schema!
export type Task = z.infer<typeof TaskSchema>;
export type TaskCategoryType = z.infer<typeof TaskCategory>;
export type TaskPriorityType = z.infer<typeof TaskPriority>;

// Schema specifically for the "Add/Edit Form" where ID and dates might not exist yet
export const TaskFormSchema = TaskSchema.omit({ 
  id: true, 
  createdAt: true, 
  isCompleted: true, 
  isArchived: true 
});

export type TaskFormData = z.infer<typeof TaskFormSchema>;
