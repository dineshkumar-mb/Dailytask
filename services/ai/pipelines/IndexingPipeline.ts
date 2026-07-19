import { Task } from '../../../types/task';
import { EmbeddingRepository } from '../../../repository/EmbeddingRepository';
import { EmbeddingService } from '../EmbeddingService';
import { Retriever } from '../Retriever';
import { EventBus } from '../../EventBus';
import { Logger } from '../../Logger';

export class IndexingPipeline {
  private static queue: Task[] = [];
  private static isProcessing = false;

  /**
   * Enqueues tasks to be embedded in the background without blocking UI startup.
   */
  static enqueueTasks(tasks: Task[], apiKey?: string): void {
    if (!apiKey || apiKey.startsWith('sk-or-')) return;

    for (const t of tasks) {
      if (!t.deleted && !t.archived) {
        this.queue.push(t);
      }
    }

    if (!this.isProcessing && this.queue.length > 0) {
      this.processQueue(apiKey);
    }
  }

  /**
   * Enqueues a single task for indexing on create or update.
   */
  static enqueueSingle(task: Task, apiKey?: string): void {
    this.enqueueTasks([task], apiKey);
  }

  private static async processQueue(apiKey: string): Promise<void> {
    this.isProcessing = true;
    Logger.info(`[IndexingPipeline] Background indexing started for ${this.queue.length} tasks.`);

    let processedCount = 0;
    const totalCount = this.queue.length;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 5); // batch size of 5

      for (const task of batch) {
        try {
          const docText = EmbeddingService.buildTaskDocument(task);
          const contentHash = EmbeddingService.computeContentHash(docText);

          // Check if already embedded with matching contentHash
          const existing = await EmbeddingRepository.getEmbedding(task.id);
          if (existing && existing.contentHash === contentHash) {
            Retriever.setTaskVector(task.id, existing.embedding, contentHash);
            processedCount++;
            continue;
          }

          // Generate new embedding
          const vector = await EmbeddingService.embed(docText, apiKey);
          if (vector) {
            await EmbeddingRepository.saveEmbedding(task.id, vector, contentHash);
            Retriever.setTaskVector(task.id, vector, contentHash);
          }

          processedCount++;
        } catch (e) {
          Logger.warn(`[IndexingPipeline] Failed to index task ${task.id}`, e);
        }
      }

      EventBus.publish('AI_INDEXING_PROGRESS', { processed: processedCount, total: totalCount });

      // Pause 500ms between batches to avoid rate limit
      if (this.queue.length > 0) {
        await new Promise((res) => setTimeout(res, 500));
      }
    }

    this.isProcessing = false;
    Logger.info('[IndexingPipeline] Background indexing complete.');
    EventBus.publish('AI_INDEXING_COMPLETE', { total: processedCount });
  }
}
