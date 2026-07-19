import { SearchResult, StoredVector } from './types';

export class VectorStore {
  private vectors: Map<string, StoredVector> = new Map();

  loadVectors(vectors: StoredVector[]): void {
    this.vectors.clear();
    for (const v of vectors) {
      if (v.vector && v.vector.length > 0) {
        this.vectors.set(v.id, v);
      }
    }
  }

  add(id: string, vector: number[], metadata?: Record<string, any>): void {
    if (!vector || vector.length === 0) return;
    this.vectors.set(id, { id, vector, metadata });
  }

  update(id: string, vector: number[], metadata?: Record<string, any>): void {
    this.add(id, vector, metadata);
  }

  delete(id: string): void {
    this.vectors.delete(id);
  }

  search(queryVector: number[], k: number = 5): SearchResult[] {
    if (!queryVector || queryVector.length === 0 || this.vectors.size === 0) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const [id, item] of this.vectors.entries()) {
      const score = VectorStore.cosineSimilarity(queryVector, item.vector);
      if (!isNaN(score)) {
        results.push({
          id,
          score,
          metadata: item.metadata,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  size(): number {
    return this.vectors.size;
  }

  clear(): void {
    this.vectors.clear();
  }
}
