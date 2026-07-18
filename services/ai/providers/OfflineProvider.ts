import { AIProvider, AIResponse } from '../types';

export class OfflineProvider implements AIProvider {
  async processMessage(userMessage: string, taskContext: any[]): Promise<AIResponse> {
    const msg = userMessage.trim();
    const msgLower = msg.toLowerCase();

    // Context calculations
    const todayStr = new Date().toDateString();
    const todayTasks = taskContext.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate).toDateString() === todayStr
    );
    const overdueTasks = taskContext.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    );

    // 1. Add Task
    // e.g. "add task Buy milk" or "create task Gym"
    const addMatch = msg.match(/^(?:add|create|new)\s+task\s+(.+)$/i) || msg.match(/^(?:add|create)\s+(.+)$/i);
    if (addMatch) {
      const title = addMatch[1].trim();
      return {
        message: `➕ **Added task:** "${title}" (Priority: Medium)\n\nI've created this task for you. You can see it on the home screen!`,
        actions: [{ type: 'ADD_TASK', payload: { title, priority: 'Medium', dueDate: null } }]
      };
    }

    // 2. Complete Task
    // e.g. "complete Buy milk" or "done with Gym"
    const completeMatch = msg.match(/^(?:complete|finish|done\s+with|check\s+off)\s+(?:task\s+)?(.+)$/i);
    if (completeMatch) {
      const searchTitle = completeMatch[1].trim().toLowerCase();
      const matchedTask = taskContext.find(t => t.title.toLowerCase() === searchTitle && !t.completed);
      if (matchedTask) {
        return {
          message: `✅ **Completed task:** "${matchedTask.title}"\n\nNice job! Keep up the momentum!`,
          actions: [{ type: 'COMPLETE_TASK', payload: { taskId: matchedTask.id } }]
        };
      }
      return {
        message: `🔍 I couldn't find an active task matching "${completeMatch[1].trim()}". Please check the spelling or add it first!`
      };
    }

    // 3. Focus on Task
    // e.g. "focus on Buy milk"
    const focusMatch = msg.match(/^(?:focus\s+on|start\s+focus\s+for|pomodoro\s+for)\s+(?:task\s+)?(.+)$/i);
    if (focusMatch) {
      const searchTitle = focusMatch[1].trim().toLowerCase();
      const matchedTask = taskContext.find(t => t.title.toLowerCase() === searchTitle && !t.completed);
      if (matchedTask) {
        return {
          message: `🎯 Starting a focus session for: "${matchedTask.title}"...`,
          actions: [{ type: 'FOCUS_TASK', payload: { taskId: matchedTask.id } }]
        };
      }
      return {
        message: `🔍 I couldn't find an active task matching "${focusMatch[1].trim()}". Try selecting one of the suggestions or starting a free focus session.`
      };
    }

    // 4. Plan day
    if (msgLower.includes('plan') || msgLower.includes('today') || msgLower.includes('day')) {
      if (todayTasks.length === 0) {
        return {
          message: "📅 You have no tasks scheduled for today. It's a great time to plan ahead — type **\"add task [title]\"** to create one!"
        };
      }
      return {
        message: `📅 **Here's your day plan:**\n\n${todayTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (${t.priority})`).join('\n')}\n\nStart with your highest-priority task first! 🚀`
      };
    }

    // 5. Overdue
    if (msgLower.includes('overdue')) {
      if (overdueTasks.length === 0) {
        return {
          message: "✅ Great news — you have no overdue tasks! You're on top of everything."
        };
      }
      return {
        message: `⚠️ **You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}:**\n\n${overdueTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n')}\n\nAddressing these first will clear your backlog.`
      };
    }

    // 6. Focus tips
    if (msgLower.includes('focus') || msgLower.includes('concentrate') || msgLower.includes('timer') || msgLower.includes('pomodoro')) {
      return {
        message: "🎯 **Focus Tip:** Try the Pomodoro technique. Focus for 25 minutes, then take a 5-minute break. Eliminate all distractions during the focus block."
      };
    }

    // 7. First task / priority
    if (msgLower.includes('first') || msgLower.includes('priorit') || msgLower.includes('start')) {
      const highPriority = taskContext.filter(t => !t.completed && t.priority === 'High');
      if (highPriority.length > 0) {
        return {
          message: `⭐ **Priority Recommendation:**\n\nTackle this high-priority task first:\n**"${highPriority[0].title}"**\n\nStarting with your hardest/highest priority task is highly effective.`
        };
      }
      return {
        message: "⭐ No high-priority tasks found. Try setting a priority on your tasks or asking me to plan your day."
      };
    }

    // 8. General tips
    if (msgLower.includes('tip') || msgLower.includes('advice') || msgLower.includes('help')) {
      const tips = [
        "💡 Break large tasks into smaller subtasks — it makes progress feel tangible and reduces overwhelm.",
        "⏰ Time-block your calendar: assign specific hours to your most important tasks.",
        "🧠 Your brain is sharpest in the first 2 hours after waking — protect that time for deep work.",
        "📱 Turn off notifications during focus sessions. Interruptions cost 23 minutes of recovery time each.",
        "✅ End each day by writing tomorrow's top 3 tasks — you'll start with clarity instead of confusion.",
      ];
      return {
        message: tips[Math.floor(Math.random() * tips.length)]
      };
    }

    return {
      message: `🤖 I'm configured in local offline mode.\n\nTo perform actions, try phrases like:\n• *"add task Gym session"*\n• *"complete task Gym session"*\n• *"focus on Gym session"*\n• *"plan my day"*\n\n🔑 **Tip:** To unlock advanced conversational AI powered by Google Gemini, enter your API key in **Settings**.`
    };
  }
}
