import { FocusRepository, FocusSessionRecord } from '../repositories/FocusRepository';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from './NotificationService';
import { useSettingsStore } from '../store/settingsStore';

export type FocusSessionType = 'focus' | 'short_break' | 'long_break';

export interface ActiveSession {
  id: string;
  taskId: string | null;
  type: FocusSessionType;
  plannedSeconds: number;
  startedAt: number; // Unix timestamp in ms
  accumulatedSeconds: number; // For paused time
  status: 'running' | 'paused';
}

export class FocusService {
  /**
   * Calculates remaining time safely even if the app was backgrounded.
   */
  static getRemainingSeconds(session: ActiveSession): number {
    if (session.status === 'paused') {
      return Math.max(0, session.plannedSeconds - session.accumulatedSeconds);
    }
    
    // If running, elapsed = accumulated + time since last start
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - session.startedAt) / 1000);
    const totalElapsed = session.accumulatedSeconds + elapsedSinceStart;
    
    return Math.max(0, session.plannedSeconds - totalElapsed);
  }

  static createSession(taskId: string | null, type: FocusSessionType, plannedSeconds: number): ActiveSession {
    return {
      id: uuidv4(),
      taskId,
      type,
      plannedSeconds,
      startedAt: Date.now(),
      accumulatedSeconds: 0,
      status: 'running',
    };
  }

  static pauseSession(session: ActiveSession): ActiveSession {
    if (session.status === 'paused') return session;
    
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - session.startedAt) / 1000);
    
    return {
      ...session,
      accumulatedSeconds: session.accumulatedSeconds + elapsedSinceStart,
      status: 'paused',
    };
  }

  static resumeSession(session: ActiveSession): ActiveSession {
    if (session.status === 'running') return session;
    
    return {
      ...session,
      startedAt: Date.now(),
      status: 'running',
    };
  }

  static async finishSession(session: ActiveSession, status: 'completed' | 'interrupted' | 'cancelled'): Promise<void> {
    // Calculate total actual seconds
    let actualSeconds = session.accumulatedSeconds;
    if (session.status === 'running') {
      actualSeconds += Math.floor((Date.now() - session.startedAt) / 1000);
    }

    // Cap at planned if completed, though it can technically go over if we allow it.
    if (status === 'completed') {
      actualSeconds = session.plannedSeconds;
    }

    const record: Partial<FocusSessionRecord> = {
      id: session.id,
      taskId: session.taskId,
      type: session.type,
      plannedSeconds: session.plannedSeconds,
      actualSeconds,
      status,
      startedAt: new Date(session.startedAt), // Approximate start, could track original start
      endedAt: new Date(),
    };

    await FocusRepository.create(record);

    // Fire focus-complete notification (native only, no-op on web)
    if (status === 'completed') {
      const prefs = useSettingsStore.getState().notifications;
      if (prefs.focusNotificationsEnabled) {
        await NotificationService.notifyFocusComplete(session.type);
      }
    }

    // Analytics hook (Phase 5)
    // AnalyticsService.logEvent('focus_session_completed', { duration: actualSeconds });
  }
}
