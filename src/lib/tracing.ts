/**
 * Tracing interface for W&B Weave integration
 * This provides a foundation for future observability features
 */

export interface TraceMetadata {
  /** Unique trace ID for the request */
  traceId: string
  /** Request timestamp in ISO format */
  timestamp: string
  /** HTTP method (GET, POST, etc.) */
  method?: string
  /** API endpoint path */
  path?: string
  /** Request duration in milliseconds */
  durationMs?: number
  /** HTTP status code */
  statusCode?: number
  /** Error message if request failed */
  error?: string
  /** Additional custom metadata */
  metadata?: Record<string, unknown>
}

export interface TraceLogger {
  /** Log a trace event */
  log(metadata: TraceMetadata): void
  /** Log the start of a request */
  startTrace(traceId: string, method: string, path: string): void
  /** Log the end of a request */
  endTrace(traceId: string, status: "success" | "error", durationMs: number): void
  /** Log an error */
  error(traceId: string, error: Error | string): void
}

/**
 * Mock trace logger for development
 * This will be replaced with W&B Weave integration in the future
 */
class MockTraceLogger implements TraceLogger {
  private traces: Map<string, Partial<TraceMetadata>> = new Map()
  private readonly MAX_TRACES = 1000 // Limit traces to prevent memory leaks
  private readonly CLEANUP_INTERVAL = 60000 // Cleanup old traces every 60 seconds
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor() {
    // Periodically clean up old traces to prevent memory leaks
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL)
    }
  }

  /**
   * Cleanup method to stop the timer and clear traces
   * Call this when the logger is no longer needed (e.g., on component unmount)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.traces.clear()
  }

  private cleanup(): void {
    // Remove traces older than 5 minutes
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [traceId, metadata] of this.traces.entries()) {
      if (metadata.timestamp) {
        const traceAge = now - new Date(metadata.timestamp).getTime()
        if (traceAge > maxAge) {
          this.traces.delete(traceId)
        }
      }
    }

    // If still too many traces, remove oldest ones
    if (this.traces.size > this.MAX_TRACES) {
      const tracesToRemove = this.traces.size - this.MAX_TRACES
      const entries = Array.from(this.traces.keys())
      for (let i = 0; i < tracesToRemove; i++) {
        this.traces.delete(entries[i])
      }
    }
  }

  log(metadata: TraceMetadata): void {
    console.log('[TRACE]', JSON.stringify(metadata, null, 2))
  }

  startTrace(traceId: string, method: string, path: string): void {
    const metadata: Partial<TraceMetadata> = {
      traceId,
      timestamp: new Date().toISOString(),
      method,
      path,
    }
    this.traces.set(traceId, metadata)
    console.log('[TRACE:START]', JSON.stringify(metadata, null, 2))
  }

  endTrace(traceId: string, status: "success" | "error", durationMs: number): void {
    const startMetadata = this.traces.get(traceId)
    const metadata: TraceMetadata = {
      ...startMetadata,
      traceId,
      timestamp: startMetadata?.timestamp || new Date().toISOString(),
      metadata: { ...startMetadata?.metadata, status },
      durationMs,
    }
    this.log(metadata)
    this.traces.delete(traceId)
  }

  error(traceId: string, error: Error | string): void {
    const startMetadata = this.traces.get(traceId)
    const metadata: TraceMetadata = {
      ...startMetadata,
      traceId,
      timestamp: startMetadata?.timestamp || new Date().toISOString(),
      error: error instanceof Error ? error.message : error,
    }
    this.log(metadata)
    this.traces.delete(traceId)
  }
}

/**
 * Global trace logger instance
 * Can be replaced with W&B Weave logger in the future
 */
export const traceLogger: TraceLogger = new MockTraceLogger()

/**
 * Generate a unique trace ID
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
