import type {
  ChatRequest,
  ChatResponse,
  VisionRequest,
  VisionResponse,
  ApiResponse
} from './types'
import { traceLogger, generateTraceId } from '../lib/tracing'

class MistralClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/mistral') {
    this.baseUrl = baseUrl
  }

  /**
   * Send a chat message to Mistral API
   * System prompt is injected server-side
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const traceId = generateTraceId()
    const startTime = Date.now()

    traceLogger.startTrace(traceId, 'POST', `${this.baseUrl}/chat`)

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data: ApiResponse<ChatResponse> = await response.json()

      const durationMs = Date.now() - startTime
      const status = response.ok && data.success ? 'success' : 'error'
      // TODO: Implement streaming support for real-time trace updates
      traceLogger.endTrace(traceId, status, durationMs)

      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to get chat response')
      }

      return data.data
    } catch (error) {
      traceLogger.error(traceId, error as Error)
      throw error
    }
  }

  /**
   * Analyze an image using Mistral Vision API
   * Returns structured analysis of handwritten content
   */
  async vision(request: VisionRequest): Promise<VisionResponse> {
    const traceId = generateTraceId()
    const startTime = Date.now()

    traceLogger.startTrace(traceId, 'POST', `${this.baseUrl}/vision`)

    try {
      const response = await fetch(`${this.baseUrl}/vision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data: ApiResponse<VisionResponse> = await response.json()

      const durationMs = Date.now() - startTime
      const status = response.ok && data.success ? 'success' : 'error'
      traceLogger.endTrace(traceId, status, durationMs)

      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to analyze image')
      }

      return data.data
    } catch (error) {
      traceLogger.error(traceId, error as Error)
      throw error
    }
  }
}

// Singleton instance
export const mistralClient = new MistralClient()
export default MistralClient
