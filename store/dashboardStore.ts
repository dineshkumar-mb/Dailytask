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

// Optional: We can automatically subscribe to taskStore changes to keep dashboard updated.
// We debounce this slightly or just run it synchronously.
useTaskStore.subscribe((state, prevState) => {
  if (state.tasks !== prevState.tasks) {
    useDashboardStore.getState().refreshDashboard();
  }
});
