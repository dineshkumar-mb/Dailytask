import { AIMemoryRepository } from '../../repository/AIMemoryRepository';
import { EmbeddingService } from './EmbeddingService';
import { MemoryExtractor } from './MemoryExtractor';
import { MemoryValidator } from './MemoryValidator';
import { AIMemory, ChatMessage, MemoryType } from './types';
import { VectorStore } from './VectorStore';
import { Logger } from '../Logger';

export class AIMemoryService {
  /**
   * Processes recent chat messages, extracts candidate memories, validates, embeds, and saves them.
   */
  static async processConversation(messages: ChatMessage[], apiKey?: string): Promise<void> {
    try {
      const candidates = await MemoryExtractor.extract(messages, apiKey);
      if (candidates.length === 0) return;

      const existingMemories = await AIMemoryRepository.getAllMemories();

      for (const candidate of candidates) {
        // Embed candidate if online
        if (apiKey) {
          const vec = await EmbeddingService.embed(candidate.content, apiKey);
          if (vec) candidate.embedding = vec;
        }

        const validation = MemoryValidator.validate(candidate, existingMemories);
        if (validation.isValid) {
          const saved = await AIMemoryRepository.save({
            content: candidate.content,
            type: candidate.type,
            importance: 1.0,
            accessCount: 0,
            embedding: candidate.embedding,
          });
          existingMemories.push(saved);
          Logger.info(`[AIMemoryService] Saved new memory: "${saved.content}" (${saved.type})`);
        } else {
          Logger.info(`[AIMemoryService] Memory candidate rejected: ${validation.reason}`);
        }
      }

      // Maintain max count cap
      await AIMemoryRepository.prune(200);
    } catch (error) {
      Logger.error('[AIMemoryService] Failed to process conversation for memories', error);
    }
  }

  /**
   * Explicitly remembers a fact provided by user or AI action tool.
   */
  static async rememberFact(
    content: string,
    type: MemoryType = 'fact',
    apiKey?: string
  ): Promise<AIMemory | null> {
    const existing = await AIMemoryRepository.getAllMemories();
    let embedding: number[] | undefined = undefined;

    if (apiKey) {
      const vec = await EmbeddingService.embed(content, apiKey);
      if (vec) embedding = vec;
    }

    const candidate = { content, type, confidence: 1.0, embedding };
    const validation = MemoryValidator.validate(candidate, existing);
    if (!validation.isValid) {
      Logger.info(`[AIMemoryService] Explicit memory rejected: ${validation.reason}`);
      return null;
    }

    const memory = await AIMemoryRepository.save({
      content,
      type,
      importance: 2.0, // Bonus for explicit save
      accessCount: 1,
      embedding,
    });

    Logger.info(`[AIMemoryService] Explicitly remembered: "${content}"`);
    return memory;
  }

  /**
   * Retrieves top-K relevant memories given query vector or query text keyword fallback.
   */
  static async retrieveRelevant(
    queryVector: number[] | null,
    queryText: string,
    k: number = 3
  ): Promise<AIMemory[]> {
    const allMemories = await AIMemoryRepository.getAllMemories();
    if (allMemories.length === 0) return [];

    // Vector retrieval if vector is available
    if (queryVector && queryVector.length > 0) {
      const scored = allMemories
        .map((m) => {
          let score = 0;
          if (m.embedding && m.embedding.length > 0) {
            score = VectorStore.cosineSimilarity(queryVector, m.embedding);
          } else {
            // Text fallback relevance
            const matchCount = queryText
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 2 && m.content.toLowerCase().includes(w)).length;
            score = matchCount * 0.2;
          }
          // Combine vector score with memory importance
          const combinedScore = score * 0.7 + (m.importance / 10) * 0.3;
          return { memory: m, score: combinedScore };
        })
        .filter((item) => item.score > 0.1);

      scored.sort((a, b) => b.score - a.score);

      const selected = scored.slice(0, k).map((item) => item.memory);

      // Increment access counts for selected memories
      for (const m of selected) {
        await AIMemoryRepository.incrementAccessCount(m.id);
      }

      return selected;
    }

    // Keyword fallback if offline / no vector query
    const words = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const matched = allMemories
      .map((m) => {
        const count = words.filter((w) => m.content.toLowerCase().includes(w)).length;
        return { memory: m, score: count };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((item) => item.memory);

    // If no keyword match, return top by importance
    if (matched.length === 0) {
      return allMemories
        .slice()
        .sort((a, b) => b.importance - a.importance)
        .slice(0, k);
    }

    return matched;
  }

  static async getAll(): Promise<AIMemory[]> {
    return await AIMemoryRepository.getAllMemories();
  }

  static async delete(id: string): Promise<void> {
    await AIMemoryRepository.delete(id);
  }
}
