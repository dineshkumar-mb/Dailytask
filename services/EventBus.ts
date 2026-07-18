import { Logger } from './Logger';

export type EventType = 
  | 'TASK_CREATED' 
  | 'TASK_UPDATED' 
  | 'TASK_COMPLETED' 
  | 'TASK_DELETED' 
  | 'FOCUS_SESSION_STARTED' 
  | 'FOCUS_SESSION_COMPLETED';

export type EventCallback<T = any> = (payload: T) => void;

export class EventBus {
  private static listeners = new Map<EventType, Set<EventCallback>>();

  static subscribe<T = any>(event: EventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  static publish<T = any>(event: EventType, payload: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          Logger.error(`[EventBus] Error in listener for event "${event}":`, err);
        }
      });
    }
  }
}
