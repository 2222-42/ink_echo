import type { VercelRequest, VercelResponse } from '@vercel/node'
import { API_CONFIG, type ApiErrorResponse } from './config'
import dns from 'node:dns'

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
