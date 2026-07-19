# DailyTasks AI Platform Architecture

## Overview
The AI Platform is a modular, production-grade on-device AI subsystem for DailyTasks. It provides semantic search, long-term memory retrieval (RAG), plugin-based tool calling, and multi-provider LLM orchestration without forcing external cloud vector database dependencies.

---

## Architectural Layers

```
User Message
     │
     ▼
┌─────────────┐
│  AIService  │   Thin Coordinator
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Planner   │   Route: Simple query vs Agent tool loop
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Agent    │   Multi-turn tool-calling loop
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Retriever  │   Retrieves & reranks tasks + memories
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  ContextBuilder  │   Assembles token-budgeted system prompt
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│ LLMGateway  │   Provider abstraction (Gemini, OpenRouter, Offline)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ ToolRegistry │   Plugin-based tool execution
└──────┬───────┘
       │
       ▼
ActionExecutor / Repositories / SQLite
```

---

## Key Modules

### 1. VectorStore (`services/ai/VectorStore.ts`)
- Pure in-memory vector calculations.
- Cosine similarity computation.
- Decoupled from persistence layers.

### 2. EmbeddingRepository (`repository/EmbeddingRepository.ts`)
- SQLite / AsyncStorage vector persistence.
- Maps task documents to vector arrays and content hashes.

### 3. Memory Pipeline (`AIMemoryService.ts`, `MemoryExtractor.ts`, `MemoryValidator.ts`, `AIMemoryRepository.ts`)
- Long-term memory extraction from user conversation turns.
- Validation rejects duplicates (cosine sim > 0.92), temporary time references, and low-confidence candidates.
- Memory taxonomy: `preference`, `goal`, `routine`, `constraint`, `fact`, `decision`, `project`, `relationship`.
- Dynamic importance score formula: `(accessCount * 0.3) + (recencyScore * 0.4) + (explicitSave * 0.2) + (aiReferenced * 0.1)`.

### 4. Semantic Cache (`services/ai/SemanticCache.ts`)
- Hashes query vector embeddings.
- Cache hit triggered when cosine similarity >= 0.95.
- 24-hour TTL; auto-invalidated on task state mutations.

### 5. Tool Registry (`services/ai/ToolRegistry.ts`)
- Plugin-based registration (`ToolRegistry.register(...)`).
- Categories: `task`, `memory`, `calendar`, `focus`, `analytics`.

### 6. LLMGateway (`services/ai/LLMGateway.ts`)
- Isolates LLM provider specifics.
- Fallback to `OfflineProvider` when offline or without API keys.

---

## Offline Behavior Matrix

| Feature | Online | Offline |
|---------|--------|---------|
| Chat | Gemini / OpenRouter | Local Offline NLP |
| Search | Vector similarity | Title / Category keyword search |
| Memory | Vector + Importance RAG | Recency / Importance local ranking |
| Tools | Agent tool calling loop | Direct store actions |
| Semantic Cache | Active (cosine >= 0.95) | Bypassed |

---

## Observability & Metrics (`services/ai/Observability.ts`)
- Tracks event durations for LLM calls, embeddings, retrievals, tool execution, and cache hits.
- Maintains lifetime metrics and error logs.
