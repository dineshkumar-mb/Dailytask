import { Logger } from '../Logger';

export interface ObservabilityEvent {
  timestamp: Date;
  type: 'llm_call' | 'embedding' | 'retrieval' | 'tool_execution' | 'cache_hit' | 'failure';
  durationMs: number;
  details?: Record<string, any>;
  error?: string;
}

export class Observability {
  private static events: ObservabilityEvent[] = [];
  private static totalCostUSD: number = 0;

  static record(event: Omit<ObservabilityEvent, 'timestamp'>): void {
    const fullEvent: ObservabilityEvent = {
      ...event,
      timestamp: new Date(),
    };
    this.events.push(fullEvent);

    if (this.events.length > 200) {
      this.events.shift();
    }

    if (event.error) {
      Logger.error(`[Observability] Event Error [${event.type}]`, event.error);
    } else {
      Logger.info(`[Observability] Event [${event.type}] took ${event.durationMs}ms`);
    }
  }

  static addCost(cost: number): void {
    this.totalCostUSD += cost;
  }

  static getStats(): {
    totalEvents: number;
    avgLatencyMs: number;
    cacheHits: number;
    failures: number;
    estimatedCostUSD: number;
  } {
    const totalEvents = this.events.length;
    const cacheHits = this.events.filter((e) => e.type === 'cache_hit').length;
    const failures = this.events.filter((e) => e.type === 'failure' || e.error).length;
    const sumLatency = this.events.reduce((acc, e) => acc + e.durationMs, 0);
    const avgLatencyMs = totalEvents > 0 ? Math.round(sumLatency / totalEvents) : 0;

    return {
      totalEvents,
      avgLatencyMs,
      cacheHits,
      failures,
      estimatedCostUSD: Number(this.totalCostUSD.toFixed(5)),
    };
  }

  static getLogs(): ObservabilityEvent[] {
    return [...this.events];
  }
}
