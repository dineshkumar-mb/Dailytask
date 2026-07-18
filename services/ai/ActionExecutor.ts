import { Alert } from 'react-native';
import { useTaskStore } from '../../store/taskStore';
import { router } from 'expo-router';
import { AIAction, AIResponse } from './types';
import { Logger } from '../Logger';

/**
 * Validates that an AIResponse conforms to the expected schema before execution.
 * Returns true if the response is safe to execute, false otherwise.
 */
export function validateAIResponse(response: unknown): response is AIResponse {
  if (!response || typeof response !== 'object') {
    Logger.error('[ActionExecutor] AI response is not an object.', { response });
    return false;
  }

  const res = response as Record<string, unknown>;

  if (typeof res.message !== 'string' || res.message.trim() === '') {
    Logger.error('[ActionExecutor] AI response missing required "message" string field.', { response });
    return false;
  }

  if (res.actions !== undefined) {
    if (!Array.isArray(res.actions)) {
      Logger.error('[ActionExecutor] AI response "actions" field is not an array.', { response });
      return false;
    }

    const validTypes = new Set(['ADD_TASK', 'COMPLETE_TASK', 'DELETE_TASK', 'FOCUS_TASK']);
    for (const action of res.actions) {
      if (!action || typeof action !== 'object') {
        Logger.error('[ActionExecutor] Invalid action item in response.', { action });
        return false;
      }
      if (!validTypes.has((action as any).type)) {
        Logger.error('[ActionExecutor] Unknown action type in response.', { type: (action as any).type });
        return false;
      }
      if (typeof (action as any).payload !== 'object') {
        Logger.error('[ActionExecutor] Action missing payload object.', { action });
        return false;
      }
    }
  }

  return true;
}

/**
 * Prompts the user for confirmation before executing a destructive action.
 * Returns a Promise<boolean> that resolves when the user responds.
 */
function confirmDestructiveAction(taskTitle?: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${taskTitle || 'this task'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

export class ActionExecutor {
  /**
   * Executes a list of validated AI actions.
   * Destructive actions (DELETE_TASK) require explicit user confirmation.
   *
   * @param actions - Array of validated AIAction objects
   * @param onCloseChat - Optional callback to close the chat modal before navigation
   */
  static async execute(actions: AIAction[], onCloseChat?: () => void): Promise<void> {
    const { addTask, toggleComplete, deleteTask, tasks } = useTaskStore.getState();

    for (const act of actions) {
      try {
        Logger.info(`[ActionExecutor] Executing action: ${act.type}`, { payload: act.payload });

        if (act.type === 'ADD_TASK') {
          const { title, priority, dueDate } = act.payload;
          if (!title || typeof title !== 'string' || title.trim() === '') {
            Logger.warn('[ActionExecutor] ADD_TASK skipped: missing or empty title.', act.payload);
            continue;
          }
          await addTask({
            title: title.trim(),
            priority: priority || 'Medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
          });
          Logger.info(`[ActionExecutor] ADD_TASK completed: "${title}"`);

        } else if (act.type === 'COMPLETE_TASK') {
          const { taskId } = act.payload;
          if (!taskId || typeof taskId !== 'string') {
            Logger.warn('[ActionExecutor] COMPLETE_TASK skipped: missing taskId.', act.payload);
            continue;
          }
          await toggleComplete(taskId);
          Logger.info(`[ActionExecutor] COMPLETE_TASK completed for taskId: ${taskId}`);

        } else if (act.type === 'DELETE_TASK') {
          const { taskId } = act.payload;
          if (!taskId || typeof taskId !== 'string') {
            Logger.warn('[ActionExecutor] DELETE_TASK skipped: missing taskId.', act.payload);
            continue;
          }

          // Find task title for a meaningful confirmation prompt
          const targetTask = tasks.find((t) => t.id === taskId);
          const confirmed = await confirmDestructiveAction(targetTask?.title);

          if (!confirmed) {
            Logger.info(`[ActionExecutor] DELETE_TASK cancelled by user for taskId: ${taskId}`);
            continue;
          }

          await deleteTask(taskId);
          Logger.info(`[ActionExecutor] DELETE_TASK completed for taskId: ${taskId}`);

        } else if (act.type === 'FOCUS_TASK') {
          const { taskId } = act.payload;
          if (!taskId || typeof taskId !== 'string') {
            Logger.warn('[ActionExecutor] FOCUS_TASK skipped: missing taskId.', act.payload);
            continue;
          }
          if (onCloseChat) onCloseChat();
          // Give a tiny delay for modal close animation
          setTimeout(() => {
            router.push(`/focus/${taskId}` as any);
          }, 100);
          Logger.info(`[ActionExecutor] FOCUS_TASK navigating to taskId: ${taskId}`);
        }
      } catch (err) {
        Logger.error(`[ActionExecutor] Failed to execute action: ${act.type}`, err, { payload: act.payload });
        // Do not re-throw — continue processing remaining actions
      }
    }
  }
}
