import { Task } from '../types/task';
import { useTaskStore } from '../store/taskStore';

export class CalendarService {
  /**
   * Formats a JS Date object to a YYYY-MM-DD local date string
   */
  static formatDate(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString();
    return localISOTime.split('T')[0];
  }

  /**
   * Reschedules a task to a new due date.
   * If newDateString is empty or null, it clears the due date.
   */
  static async rescheduleTask(taskId: string, newDateString: string | null): Promise<void> {
    const updateTask = useTaskStore.getState().updateTask;
    
    if (!newDateString) {
      await updateTask(taskId, { dueDate: undefined });
      return;
    }

    // Set the new date, preserving the original time if it existed
    const tasks = useTaskStore.getState().tasks;
    const task = tasks.find(t => t.id === taskId);
    const newDate = new Date(newDateString);

    if (task && task.dueDate) {
      const origDate = new Date(task.dueDate);
      newDate.setHours(origDate.getHours(), origDate.getMinutes(), origDate.getSeconds());
    } else {
      // Default to 9:00 AM if no time was set previously
      newDate.setHours(9, 0, 0, 0);
    }

    await updateTask(taskId, { dueDate: newDate });
  }

  /**
   * Filters a list of tasks that are due on a specific YYYY-MM-DD date string.
   * Excludes archived and deleted tasks.
   */
  static getTasksForDate(tasks: Task[], dateString: string): Task[] {
    return tasks.filter(task => {
      if (!task.dueDate || task.deleted || task.archived) return false;
      return this.formatDate(task.dueDate) === dateString;
    });
  }

  /**
   * Generates the markedDates configuration object required by react-native-calendars.
   * Places a dot on dates containing active/completed tasks.
   */
  static getMarkedDates(tasks: Task[], selectedDate: string): Record<string, any> {
    const marks: Record<string, any> = {};

    // 1. Mark selected date with blue circle styling
    marks[selectedDate] = { 
      selected: true, 
      selectedColor: '#3b82f6', 
      disableTouchEvent: false 
    };

    // 2. Add dots for dates that have tasks
    tasks.forEach(task => {
      if (task.dueDate && !task.deleted && !task.archived) {
        const dateString = this.formatDate(task.dueDate);
        
        if (!marks[dateString]) {
          marks[dateString] = { marked: true, dotColor: '#3b82f6' };
        } else {
          // If the date is already in the marks (e.g. selectedDate), ensure dot remains visible
          marks[dateString].marked = true;
          // Only set dotColor if it's not the currently selected day (which uses a white dot on blue background)
          if (dateString !== selectedDate) {
            marks[dateString].dotColor = '#3b82f6';
          } else {
            marks[dateString].selectedDotColor = '#ffffff';
          }
        }
      }
    });

    return marks;
  }
}
