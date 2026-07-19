import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { semanticCache } from '../../db/schema';
import { AIResponse } from './types';
import { VectorStore } from './VectorStore';
import { Logger } from '../Logger';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const WEB_CACHE_KEY = '@dailytask_semantic_cache_v1';

export class SemanticCache {
  private static SIMILARITY_THRESHOLD = 0.95;

  static async get(queryEmbedding: number[] | null): Promise<AIResponse | null> {
    if (!queryEmbedding || queryEmbedding.length === 0) return null;

    try {
      const items = await this.getAllCached();

      for (const item of items) {
        if (new Date(item.expiresAt) < new Date()) continue;

        const sim = VectorStore.cosineSimilarity(queryEmbedding, item.queryEmbedding);
        if (sim >= this.SIMILARITY_THRESHOLD) {
          Logger.info(`[SemanticCache] Cache Hit! Similarity: ${sim.toFixed(3)}`);
          return {
            ...item.response,
            fromCache: true,
          };
        }
      }
    } catch (e) {
      Logger.warn('[SemanticCache] Error reading cache', e);
    }

    return null;
  }

  static async set(queryEmbedding: number[] | null, response: AIResponse): Promise<void> {
    if (!queryEmbedding || queryEmbedding.length === 0 || !response) return;

    const id = uuidv4();
    const queryHash = queryEmbedding.slice(0, 5).join(',');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const entry = {
      id,
      queryHash,
      queryEmbedding,
      response,
      hitCount: 0,
      createdAt: new Date(),
      expiresAt,
    };

    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_CACHE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        list.push(entry);
        await AsyncStorage.setItem(WEB_CACHE_KEY, JSON.stringify(list.slice(-50)));
      } catch (e) {}
      return;
    }

    try {
      await db.insert(semanticCache).values({
        id,
        queryHash,
        queryEmbedding: JSON.stringify(queryEmbedding),
        response: JSON.stringify(response),
        hitCount: 0,
        createdAt: new Date(),
        expiresAt,
      });
    } catch (e) {
      Logger.warn('[SemanticCache] Error writing cache', e);
    }
  }

  static async invalidate(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        await AsyncStorage.removeItem(WEB_CACHE_KEY);
      } catch (e) {}
      return;
    }

    try {
      await db.delete(semanticCache);
      Logger.info('[SemanticCache] Cache invalidated on task mutation.');
    } catch (e) {}
  }

  private static async getAllCached(): Promise<any[]> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    try {
      const rows = await db.select().from(semanticCache);
      return rows.map((r: any) => ({
        id: r.id,
        queryEmbedding: JSON.parse(r.queryEmbedding),
        response: JSON.parse(r.response),
        expiresAt: r.expiresAt,
      }));
    } catch (e) {
      return [];
    }
  }
}
