import type { VercelRequest, VercelResponse } from '@vercel/node'
import { API_CONFIG, type ApiErrorResponse } from './config.js'
import { generateTraceId, logTrace, type TraceMetadata } from './tracing.js'
import dns from 'node:dns'

// Extended VercelRequest with tracing support
interface TracedVercelRequest extends VercelRequest {
  traceId?: string
}

// Workaround for Node.js >= 18 fetch EAI_AGAIN local IPv6 issues
try {
  dns.setDefaultResultOrder('ipv4first')
} catch (e) {
  // Ignore if not supported or in environment where dns is unavailable
}

// Middleware to handle CORS
export function withCors(handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) {
  return (req: VercelRequest, res: VercelResponse) => {
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', API_CONFIG.CORS_HEADERS['Access-Control-Allow-Origin'])
    res.setHeader('Access-Control-Allow-Methods', API_CONFIG.CORS_HEADERS['Access-Control-Allow-Methods'])
    res.setHeader('Access-Control-Allow-Headers', API_CONFIG.CORS_HEADERS['Access-Control-Allow-Headers'])

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }

    return handler(req, res)
  }
}

// Middleware to validate API keys
export function withApiKeyValidation(handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) {
  return (req: VercelRequest, res: VercelResponse) => {
    // Check if required API keys are set in environment
    const requiredKeys = ['MISTRAL_API_KEY', 'ELEVENLABS_API_KEY']
    const missingKeys = requiredKeys.filter(key => !process.env[key])

    if (missingKeys.length > 0) {
      const errorResponse: ApiErrorResponse = {
        error: `Missing required API keys: ${missingKeys.join(', ')}`,
        code: API_CONFIG.ERROR_CODES.MISSING_API_KEY,
        success: false,
      }
      res.status(500).json(errorResponse)
      return
    }

    return handler(req, res)
  }
}

// Middleware to handle errors consistently
export function withErrorHandling(handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('API Error:', error)

      let errorMessage = 'Internal server error'
      let errorCode = API_CONFIG.ERROR_CODES.INTERNAL_ERROR

      if (error instanceof Error) {
        errorMessage = error.message
      }

      const errorResponse: ApiErrorResponse = {
        error: errorMessage,
        code: errorCode,
        success: false,
      }

      res.status(500).json(errorResponse)
    }
  }
}

// Middleware to validate request body
export function withRequestValidation(handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) {
  return (req: VercelRequest, res: VercelResponse) => {
    if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Request body is required',
        code: API_CONFIG.ERROR_CODES.INVALID_REQUEST,
        success: false,
      }
      res.status(400).json(errorResponse)
      return
    }

    return handler(req, res)
  }
}

// Middleware to trace API requests for W&B Weave integration
// NOTE: This middleware intercepts both res.json() and res.end() to capture
// all response types. Streaming responses are also traced when they call res.end().
export function withTracing(handler: (req: VercelRequest, res: VercelResponse) => void | Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const traceId = generateTraceId()
    const startTime = Date.now()
    
    // Add trace ID to request for downstream use
    const tracedReq = req as TracedVercelRequest
    tracedReq.traceId = traceId

    // Log trace start
    const startMetadata: TraceMetadata = {
      traceId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
    }
    logTrace(startMetadata)

    // Store original json and end methods to intercept response
    const originalJson = res.json.bind(res)
    const originalEnd = res.end.bind(res)
    let traced = false

    res.json = function (body: unknown) {
      if (!traced) {
        const durationMs = Date.now() - startTime
        const endMetadata: TraceMetadata = {
          traceId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.url,
          durationMs,
          statusCode: res.statusCode,
          metadata: {
            success: (body as { success?: boolean })?.success,
            hasError: !!(body as { error?: string })?.error,
          },
        }
        logTrace(endMetadata)
        traced = true
      }
      return originalJson(body)
    } as typeof res.json

    res.end = function (...args: unknown[]) {
      if (!traced) {
        const durationMs = Date.now() - startTime
        const endMetadata: TraceMetadata = {
          traceId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.url,
          durationMs,
          statusCode: res.statusCode,
        }
        logTrace(endMetadata)
        traced = true
      }
      return originalEnd(...args)
    } as typeof res.end

    try {
      await handler(req, res)
    } catch (error) {
      if (!traced) {
        const durationMs = Date.now() - startTime
        const errorMetadata: TraceMetadata = {
          traceId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.url,
          durationMs,
          error: error instanceof Error ? error.message : String(error),
        }
        logTrace(errorMetadata)
        traced = true
      }
      throw error
    }
  }
}
