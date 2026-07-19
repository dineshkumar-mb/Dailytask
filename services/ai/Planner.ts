export type PlanRoute = 'SIMPLE_REPLY' | 'AGENT_LOOP';

export interface PlanDecision {
  route: PlanRoute;
  reason: string;
}

export class Planner {
  private static ACTION_VERBS = [
    'add',
    'create',
    'new',
    'make',
    'complete',
    'finish',
    'done',
    'delete',
    'remove',
    'clear',
    'focus',
    'start',
    'plan',
    'show',
    'find',
    'search',
    'remember',
    'recall',
    'forget',
  ];

  private static TASK_KEYWORDS = [
    'task',
    'todo',
    'overdue',
    'today',
    'tomorrow',
    'priority',
    'calendar',
    'deadline',
    'habit',
    'schedule',
  ];

  /**
   * Classifies user query to determine if simple direct answer suffices or if Agent tool loop is required.
   */
  static plan(userMessage: string): PlanDecision {
    const text = userMessage.trim().toLowerCase();

    // Check simple greetings & small talk
    if (/^(hi|hello|hey|good morning|good evening|thanks|thank you|bye|who are you|what can you do)\b/i.test(text)) {
      return { route: 'SIMPLE_REPLY', reason: 'Greeting or casual chat' };
    }

    // Check general productivity questions without action intent
    if (
      (text.includes('pomodoro') || text.includes('tip') || text.includes('advice') || text.includes('explain')) &&
      !this.hasActionVerb(text)
    ) {
      return { route: 'SIMPLE_REPLY', reason: 'General explanation or tip request' };
    }

    // Check action verbs or task keywords
    const hasAction = this.hasActionVerb(text);
    const hasKeyword = this.TASK_KEYWORDS.some((kw) => text.includes(kw));

    if (hasAction || hasKeyword) {
      return { route: 'AGENT_LOOP', reason: 'Action verb or task keyword detected' };
    }

    // Default to AGENT_LOOP for safe general processing
    return { route: 'AGENT_LOOP', reason: 'Default agent routing' };
  }

  private static hasActionVerb(text: string): boolean {
    const words = text.split(/\s+/);
    return words.some((w) => this.ACTION_VERBS.includes(w));
  }
}
