import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { aiMemories } from '../db/schema';
import { AIMemory, MemoryType } from '../services/ai/types';
import { Logger } from '../services/Logger';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const WEB_MEMORIES_KEY = '@dailytask_memories_v1';

export class AIMemoryRepository {
  static async save(memory: Partial<AIMemory> & { content: string; type: MemoryType }): Promise<AIMemory> {
    const newMemory: AIMemory = {
      id: memory.id || uuidv4(),
      content: memory.content,
      type: memory.type,
      importance: memory.importance ?? 1.0,
      accessCount: memory.accessCount ?? 0,
      lastAccessedAt: memory.lastAccessedAt,
      source: memory.source,
      createdAt: memory.createdAt || new Date(),
      updatedAt: new Date(),
      embedding: memory.embedding,
    };

    const embeddingStr = newMemory.embedding ? JSON.stringify(newMemory.embedding) : null;

    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_MEMORIES_KEY);
        const map = stored ? JSON.parse(stored) : {};
        map[newMemory.id] = newMemory;
        await AsyncStorage.setItem(WEB_MEMORIES_KEY, JSON.stringify(map));
      } catch (e) {
        Logger.error('[AIMemoryRepository] Web save memory failed', e);
      }
      return newMemory;
    }

    try {
      await db
        .insert(aiMemories)
        .values({
          id: newMemory.id,
          content: newMemory.content,
          embedding: embeddingStr,
          type: newMemory.type,
          importance: newMemory.importance,
          accessCount: newMemory.accessCount,
          lastAccessedAt: newMemory.lastAccessedAt,
          source: newMemory.source,
          createdAt: newMemory.createdAt,
          updatedAt: newMemory.updatedAt,
        })
        .onConflictDoUpdate({
          target: aiMemories.id,
          set: {
            content: newMemory.content,
            embedding: embeddingStr,
            type: newMemory.type,
            importance: newMemory.importance,
            accessCount: newMemory.accessCount,
            lastAccessedAt: newMemory.lastAccessedAt,
            updatedAt: newMemory.updatedAt,
          },
        });
    } catch (e) {
      Logger.error(`[AIMemoryRepository] Failed to save memory ${newMemory.id}`, e);
    }

    return newMemory;
  }

  static async getAllMemories(): Promise<AIMemory[]> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_MEMORIES_KEY);
        if (!stored) return [];
        const map = JSON.parse(stored);
        return Object.values(map).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          lastAccessedAt: item.lastAccessedAt ? new Date(item.lastAccessedAt) : undefined,
        }));
      } catch (e) {
        return [];
      }
    }

    try {
      const rows = await db.select().from(aiMemories);
      return rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        type: row.type as MemoryType,
        importance: row.importance,
        accessCount: row.accessCount,
        lastAccessedAt: row.lastAccessedAt ? new Date(row.lastAccessedAt) : undefined,
        source: row.source || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      }));
    } catch (e) {
      Logger.error('[AIMemoryRepository] Failed to fetch memories', e);
      return [];
    }
  }

  static async incrementAccessCount(id: string): Promise<void> {
    const memories = await this.getAllMemories();
    const target = memories.find((m) => m.id === id);
    if (!target) return;

    target.accessCount += 1;
    target.lastAccessedAt = new Date();
    // Dynamic importance formula: importance = (accessCount * 0.3) + (recencyScore * 0.4) + (explicitSave * 0.2) + (aiReferenced * 0.1)
    const daysSinceAccess = 0;
    const recencyScore = 1 / (1 + daysSinceAccess);
    target.importance = target.accessCount * 0.3 + recencyScore * 0.4 + 1.0;

    await this.save(target);
  }

  static async delete(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        const stored = await AsyncStorage.getItem(WEB_MEMORIES_KEY);
        if (!stored) return;
        const map = JSON.parse(stored);
        delete map[id];
        await AsyncStorage.setItem(WEB_MEMORIES_KEY, JSON.stringify(map));
      } catch (e) {}
      return;
    }

    try {
      await db.delete(aiMemories).where(eq(aiMemories.id, id));
    } catch (e) {
      Logger.error(`[AIMemoryRepository] Delete failed for ${id}`, e);
    }
  }

  static async prune(maxCount: number = 200): Promise<void> {
    const all = await this.getAllMemories();
    if (all.length <= maxCount) return;

    // Sort by importance descending
    all.sort((a, b) => b.importance - a.importance);
    const toDelete = all.slice(maxCount);

    for (const item of toDelete) {
      await this.delete(item.id);
    }
    Logger.info(`[AIMemoryRepository] Pruned ${toDelete.length} old/low-importance memories.`);
  }
}
