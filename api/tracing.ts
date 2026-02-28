/**
 * Backend tracing utilities for W&B Weave integration
 * This module provides server-side tracing for API endpoints
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
  metadata?: Record<string, any>
}

/**
 * Generate a unique trace ID
 */
export function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log trace metadata to console
 * This will be replaced with W&B Weave integration in the future
 */
export function logTrace(metadata: TraceMetadata): void {
  console.log('[TRACE]', JSON.stringify(metadata, null, 2))
}
