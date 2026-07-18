import { create } from 'zustand';
import { DashboardMetrics, DashboardService } from '../services/DashboardService';
import { useTaskStore } from './taskStore';

interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  
  // Actions
  refreshDashboard: () => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  isLoading: true,

  setLoading: (loading) => set({ isLoading: loading }),

  refreshDashboard: () => {
    // We intentionally don't set isLoading=true here if we already have metrics,
    // to allow silent background refreshing without UI flickering.
    try {
      const tasks = useTaskStore.getState().tasks;
      const metrics = DashboardService.computeMetrics(tasks);
      set({ metrics, isLoading: false });
    } catch (error) {
      console.error("Failed to compute dashboard metrics:", error);
      set({ isLoading: false });
    }
  },
}));

import { EventBus } from '../services/EventBus';

// Subscribe to Event Bus to decouple stores
EventBus.subscribe('TASK_CREATED', () => useDashboardStore.getState().refreshDashboard());
EventBus.subscribe('TASK_UPDATED', () => useDashboardStore.getState().refreshDashboard());
EventBus.subscribe('TASK_DELETED', () => useDashboardStore.getState().refreshDashboard());
EventBus.subscribe('TASK_COMPLETED', () => useDashboardStore.getState().refreshDashboard());
EventBus.subscribe('FOCUS_SESSION_COMPLETED', () => useDashboardStore.getState().refreshDashboard());
