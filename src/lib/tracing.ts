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
  endTrace(traceId: string, statusCode: number, durationMs: number): void
  /** Log an error */
  error(traceId: string, error: Error | string): void
}

/**
 * Mock trace logger for development
 * This will be replaced with W&B Weave integration in the future
 */
class MockTraceLogger implements TraceLogger {
  private traces: Map<string, Partial<TraceMetadata>> = new Map()

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

  endTrace(traceId: string, statusCode: number, durationMs: number): void {
    const startMetadata = this.traces.get(traceId)
    const metadata: TraceMetadata = {
      ...startMetadata,
      traceId,
      timestamp: startMetadata?.timestamp || new Date().toISOString(),
      statusCode,
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
