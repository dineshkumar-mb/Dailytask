import { AIMemory, MemoryType } from './types';
import { VectorStore } from './VectorStore';

export interface CandidateMemory {
  content: string;
  type: MemoryType;
  confidence?: number;
  embedding?: number[];
}

export class MemoryValidator {
  private static TEMPORARY_PATTERNS = [
    /\btoday\b/i,
    /\bright now\b/i,
    /\bthis week\b/i,
    /\bcurrently\b/i,
    /\bthis afternoon\b/i,
    /\btonight\b/i,
    /\btomorrow\b/i,
    /\byesterday\b/i,
  ];

  private static VAGUE_PATTERNS = [
    /^user likes things/i,
    /^user has tasks/i,
    /^something to do/i,
    /^stuff/i,
  ];

  static validate(
    candidate: CandidateMemory,
    existingMemories: AIMemory[]
  ): { isValid: boolean; reason?: string } {
    if (!candidate.content || candidate.content.trim().length < 5) {
      return { isValid: false, reason: 'Content too short' };
    }

    const content = candidate.content.trim();

    // 1. Check confidence
    if (candidate.confidence !== undefined && candidate.confidence < 0.7) {
      return { isValid: false, reason: 'Confidence score below 0.7 threshold' };
    }

    // 2. Reject temporary facts
    for (const pattern of this.TEMPORARY_PATTERNS) {
      if (pattern.test(content)) {
        return { isValid: false, reason: 'Contains temporary time reference' };
      }
    }

    // 3. Reject vague generalities
    for (const pattern of this.VAGUE_PATTERNS) {
      if (pattern.test(content)) {
        return { isValid: false, reason: 'Vague generality' };
      }
    }

    // 4. Reject duplicates via text or vector comparison
    const contentLower = content.toLowerCase();
    for (const existing of existingMemories) {
      if (existing.content.toLowerCase() === contentLower) {
        return { isValid: false, reason: 'Exact text duplicate of existing memory' };
      }

      // Check vector similarity if both embeddings present
      if (candidate.embedding && existing.embedding) {
        const sim = VectorStore.cosineSimilarity(candidate.embedding, existing.embedding);
        if (sim > 0.92) {
          return { isValid: false, reason: `Semantic duplicate of memory "${existing.content}" (${sim.toFixed(2)})` };
        }
      }
    }

    return { isValid: true };
  }
}
