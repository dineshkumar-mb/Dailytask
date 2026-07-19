import { Task } from '../../types/task';
import { Logger } from '../Logger';

export class EmbeddingService {
  /**
   * Generates a 768-dim embedding vector using Gemini text-embedding-004 model.
   * Returns null if offline or no key available.
   */
  static async embed(text: string, apiKey?: string): Promise<number[] | null> {
    if (!apiKey || !text || text.trim().length === 0) {
      return null;
    }

    // Standardize key check
    const cleanKey = apiKey.trim();
    if (cleanKey.startsWith('sk-or-')) {
      // OpenRouter doesn't support Gemini embedding endpoint directly in standard format, return null
      return null;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: text.trim() }],
            },
          }),
        }
      );

      if (!response.ok) {
        Logger.warn(`[EmbeddingService] Embedding API returned status ${response.status}`);
        return null;
      }

      const data = await response.json();
      const values = data.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
      return null;
    } catch (error) {
      Logger.warn('[EmbeddingService] Failed to generate embedding', error);
      return null;
    }
  }

  /**
   * Batch embeds multiple texts.
   */
  static async embedBatch(texts: string[], apiKey?: string): Promise<(number[] | null)[]> {
    const results: (number[] | null)[] = [];
    for (const text of texts) {
      const vec = await this.embed(text, apiKey);
      results.push(vec);
    }
    return results;
  }

  /**
   * Normalizes a task object into a rich text document for embedding.
   */
  static buildTaskDocument(task: Task): string {
    const parts: string[] = [];
    parts.push(`Task: ${task.title}`);
    if (task.priority) parts.push(`Priority: ${task.priority}`);
    if (task.category) parts.push(`Category: ${task.category}`);
    if (task.description && task.description.trim()) {
      parts.push(`Description: ${task.description.trim()}`);
    }
    if (task.tags && task.tags.length > 0) {
      parts.push(`Tags: ${task.tags.join(', ')}`);
    }
    if (task.subtasks && task.subtasks.length > 0) {
      parts.push(`Subtasks: ${task.subtasks.map((s) => s.title).join('; ')}`);
    }
    if (task.notes && task.notes.trim()) {
      parts.push(`Notes: ${task.notes.trim()}`);
    }
    parts.push(`Status: ${task.completed ? 'completed' : 'active'}`);
    return parts.join('\n');
  }

  /**
   * Generates a simple hash of a string to detect if task content has changed.
   */
  static computeContentHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}
