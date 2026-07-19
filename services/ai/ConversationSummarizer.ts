import { AIMemoryService } from './AIMemoryService';
import { SUMMARIZATION_PROMPT } from './prompts/summarization';
import { ChatMessage } from './types';
import { Logger } from '../Logger';

export class ConversationSummarizer {
  /**
   * Checks if conversation needs summarization (>= 30 messages).
   * Summarizes early history and extracts key productivity memories.
   */
  static async summarizeIfNeeded(
    messages: ChatMessage[],
    apiKey?: string
  ): Promise<{ summarizedMessages: ChatMessage[]; summaryCreated: boolean }> {
    if (!messages || messages.length < 30) {
      return { summarizedMessages: messages, summaryCreated: false };
    }

    Logger.info('[ConversationSummarizer] Summarizing long conversation history...');

    const toSummarize = messages.slice(0, messages.length - 10);
    const recent = messages.slice(messages.length - 10);

    const historyText = toSummarize.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    let summaryText = 'User and AI discussed task organization, priorities, and daily planning.';

    if (apiKey && !apiKey.startsWith('sk-or-')) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${SUMMARIZATION_PROMPT}\n\nConversation:\n${historyText}` }] }],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (txt) summaryText = txt.trim();
        }
      } catch (e) {
        Logger.warn('[ConversationSummarizer] Summarization API failed, using default', e);
      }
    }

    // Save summary as memory
    await AIMemoryService.rememberFact(`Conversation Summary: ${summaryText}`, 'fact', apiKey);

    const summaryMessage: ChatMessage = {
      id: `summary-${Date.now()}`,
      role: 'ai',
      text: `📜 **Conversation History Summarized:**\n${summaryText}`,
    };

    return {
      summarizedMessages: [summaryMessage, ...recent],
      summaryCreated: true,
    };
  }
}
