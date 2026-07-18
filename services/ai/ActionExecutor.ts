import { useTaskStore } from '../../store/taskStore';
import { router } from 'expo-router';
import { AIAction } from './types';

export class ActionExecutor {
  static async execute(actions: AIAction[], onCloseChat?: () => void): Promise<void> {
    const addTask = useTaskStore.getState().addTask;
    const toggleComplete = useTaskStore.getState().toggleComplete;
    const deleteTask = useTaskStore.getState().deleteTask;

    for (const act of actions) {
      try {
        if (act.type === 'ADD_TASK') {
          const { title, priority, dueDate } = act.payload;
          if (title) {
            await addTask({
              title,
              priority: priority || 'Medium',
              dueDate: dueDate ? new Date(dueDate) : undefined,
            });
          }
        } else if (act.type === 'COMPLETE_TASK') {
          const { taskId } = act.payload;
          if (taskId) {
            await toggleComplete(taskId);
          }
        } else if (act.type === 'DELETE_TASK') {
          const { taskId } = act.payload;
          if (taskId) {
            await deleteTask(taskId);
          }
        } else if (act.type === 'FOCUS_TASK') {
          const { taskId } = act.payload;
          if (taskId) {
            if (onCloseChat) onCloseChat();
            // Give a tiny delay for modal close animation
            setTimeout(() => {
              router.push(`/focus/${taskId}` as any);
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to execute action:', act, err);
      }
    }
  }
}
