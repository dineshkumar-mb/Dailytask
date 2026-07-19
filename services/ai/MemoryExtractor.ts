import { CandidateMemory } from './MemoryValidator';
import { ChatMessage, MemoryType } from './types';
import { Logger } from '../Logger';

export class MemoryExtractor {
  /**
   * Extracts facts, preferences, routines, goals, constraints from a conversation using LLM or heuristic fallback.
   */
  static async extract(
    messages: ChatMessage[],
    apiKey?: string
  ): Promise<CandidateMemory[]> {
    if (!messages || messages.length === 0) return [];

    // Filter user messages
    const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.text);
    if (userMessages.length === 0) return [];

    const conversationText = userMessages.join('\n');

    // Rule-based heuristic extraction (always works online & offline)
    const heuristics = this.extractHeuristics(conversationText);

    // If no API key or offline, return heuristics
    if (!apiKey || apiKey.startsWith('sk-or-')) {
      return heuristics;
    }

    try {
      const prompt = `Analyze the following user statements from a chat conversation.
Extract long-term facts, preferences, goals, routines, constraints, or decisions about the user that would be useful for a personal productivity AI assistant.

Do NOT extract temporary states (e.g. "I am hungry", "I am working on X today").
Only extract enduring traits, preferences, habits, or explicit facts.

Return JSON in this format:
{
  "memories": [
    {
      "content": "User prefers deep work in the mornings",
      "type": "preference" | "goal" | "routine" | "constraint" | "fact" | "decision" | "project" | "relationship",
      "confidence": 0.9
    }
  ]
}

Conversation:
${conversationText}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed.memories)) {
            const llmMemories: CandidateMemory[] = parsed.memories.map((m: any) => ({
              content: m.content,
              type: (m.type as MemoryType) || 'fact',
              confidence: m.confidence ?? 0.85,
            }));
            return [...heuristics, ...llmMemories];
          }
        }
      }
    } catch (error) {
      Logger.warn('[MemoryExtractor] LLM extraction failed, using heuristics', error);
    }

    return heuristics;
  }

  private static extractHeuristics(text: string): CandidateMemory[] {
    const candidates: CandidateMemory[] = [];

    // Explicit preference patterns: "I prefer X", "I like X", "I always X"
    const prefMatch = text.match(/I\s+(?:prefer|like|always|enjoy)\s+([^.!\n]+)/i);
    if (prefMatch) {
      candidates.push({
        content: `User preference: ${prefMatch[1].trim()}`,
        type: 'preference',
        confidence: 0.8,
      });
    }

    // Goal patterns: "my goal is X", "I want to achieve X"
    const goalMatch = text.match(/(?:my goal is|I want to achieve|aiming to)\s+([^.!\n]+)/i);
    if (goalMatch) {
      candidates.push({
        content: `User goal: ${goalMatch[1].trim()}`,
        type: 'goal',
        confidence: 0.85,
      });
    }

    // Constraint patterns: "I cannot X", "I don't work on X", "allergic to X"
    const constraintMatch = text.match(/I\s+(?:cannot|can't|don't work on|never)\s+([^.!\n]+)/i);
    if (constraintMatch) {
      candidates.push({
        content: `User constraint: ${constraintMatch[1].trim()}`,
        type: 'constraint',
        confidence: 0.8,
      });
    }

    return candidates;
  }
}
