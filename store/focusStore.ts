import { create } from 'zustand';
import { ActiveSession, FocusService, FocusSessionType } from '../services/FocusService';

interface FocusState {
  activeSession: ActiveSession | null;
  timeLeft: number; // Updated frequently for the UI
  
  // Actions
  startSession: (taskId: string | null, type: FocusSessionType, minutes: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (status: 'completed' | 'interrupted' | 'cancelled') => Promise<void>;
  tick: () => void; // Called by a UI interval to update timeLeft
}

export const useFocusStore = create<FocusState>((set, get) => ({
  activeSession: null,
  timeLeft: 0,

  startSession: (taskId, type, minutes) => {
    const plannedSeconds = minutes * 60;
    const session = FocusService.createSession(taskId, type, plannedSeconds);
    set({
      activeSession: session,
      timeLeft: plannedSeconds,
    });
  },

  pauseSession: () => {
    const session = get().activeSession;
    if (!session) return;
    const pausedSession = FocusService.pauseSession(session);
    set({
      activeSession: pausedSession,
      timeLeft: FocusService.getRemainingSeconds(pausedSession),
    });
  },

  resumeSession: () => {
    const session = get().activeSession;
    if (!session) return;
    const resumedSession = FocusService.resumeSession(session);
    set({ activeSession: resumedSession });
  },

  finishSession: async (status) => {
    const session = get().activeSession;
    if (!session) return;
    
    // Clear the active session immediately for snappy UI
    set({ activeSession: null, timeLeft: 0 });
    
    // Persist to DB in the background
    await FocusService.finishSession(session, status);
  },

  tick: () => {
    const session = get().activeSession;
    if (!session || session.status === 'paused') return;
    
    const remaining = FocusService.getRemainingSeconds(session);
    set({ timeLeft: remaining });
    
    // Handle Auto-Complete or End of Timer
    if (remaining <= 0) {
      // Don't auto-complete the task as requested, just complete the session
      get().finishSession('completed');
    }
  },
}));
