import { Task } from '../../types/task';
import { AIMemoryRepository } from '../../repository/AIMemoryRepository';
import { EmbeddingRepository } from '../../repository/EmbeddingRepository';
import { AIMemoryService } from './AIMemoryService';
import { EmbeddingService } from './EmbeddingService';
import { AIMemory } from './types';
import { VectorStore } from './VectorStore';

export interface RetrievalResult {
  tasks: Task[];
  memories: AIMemory[];
  queryVector: number[] | null;
}

export class Retriever {
  private static taskVectorStore: VectorStore = new VectorStore();
  private static initialized: boolean = false;

  /**
   * Initializes / loads cached vector embeddings into in-memory VectorStore.
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    const storedVectors = await EmbeddingRepository.getAllEmbeddings();
    this.taskVectorStore.loadVectors(storedVectors);
    this.initialized = true;
  }

  /**
   * Update or add a task vector in the retriever's VectorStore.
   */
  static setTaskVector(taskId: string, vector: number[], contentHash: string): void {
    this.taskVectorStore.add(taskId, vector, { contentHash });
  }

  /**
   * Retrieves semantically relevant tasks and long-term memories for a query.
   */
  static async retrieve(
    queryText: string,
    allTasks: Task[],
    apiKey?: string,
    kTasks: number = 5,
    kMemories: number = 3
  ): Promise<RetrievalResult> {
    await this.initialize();

    let queryVector: number[] | null = null;
    if (apiKey) {
      queryVector = await EmbeddingService.embed(queryText, apiKey);
    }

    // 1. Task Retrieval
    let retrievedTasks: Task[] = [];

    if (queryVector && this.taskVectorStore.size() > 0) {
      // Vector search
      const searchResults = this.taskVectorStore.search(queryVector, kTasks * 2);
      const activeTasksMap = new Map(allTasks.map((t) => [t.id, t]));

      const scoredTasks = searchResults
        .map((sr) => {
          const task = activeTasksMap.get(sr.id);
          if (!task || task.deleted || task.archived) return null;

          // Priority bonus
          let priorityBonus = 0;
          if (task.priority === 'Urgent') priorityBonus = 0.2;
          if (task.priority === 'High') priorityBonus = 0.1;

          return { task, score: sr.score + priorityBonus };
        })
        .filter((item): item is { task: Task; score: number } => item !== null);

      scoredTasks.sort((a, b) => b.score - a.score);
      retrievedTasks = scoredTasks.slice(0, kTasks).map((item) => item.task);
    }

    // Keyword fallback for tasks if vector search returned fewer than needed
    if (retrievedTasks.length < kTasks) {
      const keywords = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const existingIds = new Set(retrievedTasks.map((t) => t.id));

      const keywordMatches = allTasks
        .filter((t) => !t.deleted && !t.archived && !existingIds.has(t.id))
        .map((t) => {
          const text = `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase();
          const matchCount = keywords.filter((kw) => text.includes(kw)).length;
          return { task: t, matchCount };
        })
        .filter((item) => item.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, kTasks - retrievedTasks.length)
        .map((item) => item.task);

      retrievedTasks = [...retrievedTasks, ...keywordMatches];
    }

    // Fallback: If still no tasks retrieved, take top incomplete/active tasks by priority
    if (retrievedTasks.length === 0) {
      retrievedTasks = allTasks
        .filter((t) => !t.completed && !t.deleted && !t.archived)
        .slice(0, kTasks);
    }

    // 2. Memory Retrieval
    const retrievedMemories = await AIMemoryService.retrieveRelevant(queryVector, queryText, kMemories);

    return {
      tasks: retrievedTasks,
      memories: retrievedMemories,
      queryVector,
    };
  }
}
