import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { taskEmbeddings } from '../db/schema';
import { StoredVector } from '../services/ai/types';
import { Logger } from '../services/Logger';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEB_EMBEDDINGS_KEY = '@dailytask_embeddings_v1';

export class EmbeddingRepository {
  static async saveEmbedding(
    taskId: string,
    embedding: number[],
    contentHash: string,
    model: string = 'text-embedding-004'
  ): Promise<void> {
    const jsonStr = JSON.stringify(embedding);

    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_EMBEDDINGS_KEY);
        const map = stored ? JSON.parse(stored) : {};
        map[taskId] = { taskId, embedding, contentHash, model, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(WEB_EMBEDDINGS_KEY, JSON.stringify(map));
      } catch (e) {
        Logger.error('[EmbeddingRepository] Web save failed', e);
      }
      return;
    }

    try {
      await db
        .insert(taskEmbeddings)
        .values({
          taskId,
          embedding: jsonStr,
          contentHash,
          model,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: taskEmbeddings.taskId,
          set: {
            embedding: jsonStr,
            contentHash,
            model,
            updatedAt: new Date(),
          },
        });
    } catch (e) {
      Logger.error(`[EmbeddingRepository] Failed to save embedding for task ${taskId}`, e);
    }
  }

  static async getEmbedding(taskId: string): Promise<{ taskId: string; embedding: number[]; contentHash: string } | null> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_EMBEDDINGS_KEY);
        if (!stored) return null;
        const map = JSON.parse(stored);
        return map[taskId] || null;
      } catch (e) {
        return null;
      }
    }

    try {
      const rows = await db.select().from(taskEmbeddings).where(eq(taskEmbeddings.taskId, taskId)).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        taskId: row.taskId,
        embedding: JSON.parse(row.embedding),
        contentHash: row.contentHash,
      };
    } catch (e) {
      Logger.error(`[EmbeddingRepository] Failed to get embedding for task ${taskId}`, e);
      return null;
    }
  }

  static async getAllEmbeddings(): Promise<StoredVector[]> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_EMBEDDINGS_KEY);
        if (!stored) return [];
        const map = JSON.parse(stored);
        return Object.values(map).map((item: any) => ({
          id: item.taskId,
          vector: item.embedding,
          metadata: { contentHash: item.contentHash },
        }));
      } catch (e) {
        return [];
      }
    }

    try {
      const rows = await db.select().from(taskEmbeddings);
      return rows.map((row: any) => ({
        id: row.taskId,
        vector: JSON.parse(row.embedding),
        metadata: { contentHash: row.contentHash },
      }));
    } catch (e) {
      Logger.error('[EmbeddingRepository] Failed to load all embeddings', e);
      return [];
    }
  }

  static async deleteEmbedding(taskId: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_EMBEDDINGS_KEY);
        if (!stored) return;
        const map = JSON.parse(stored);
        delete map[taskId];
        await AsyncStorage.setItem(WEB_EMBEDDINGS_KEY, JSON.stringify(map));
      } catch (e) {}
      return;
    }

    try {
      await db.delete(taskEmbeddings).where(eq(taskEmbeddings.taskId, taskId));
    } catch (e) {
      Logger.error(`[EmbeddingRepository] Failed to delete embedding for task ${taskId}`, e);
    }
  }
}
