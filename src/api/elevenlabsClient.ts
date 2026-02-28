import type { TTSSpeakRequest, ApiResponse } from './types'
import { traceLogger, generateTraceId } from '../lib/tracing'

/**
 * Returns ElevenLabs voice stability/style params based on conversation turn.
 * Turn 1-4: calm, Turn 5-6: warming up, Turn 7+: emotional climax
 */
export function getToneParams(turn: number): { stability: number; style: number } {
  if (turn >= 7) return { stability: 0.45, style: 0.55 }
  if (turn >= 5) return { stability: 0.55, style: 0.45 }
  return { stability: 0.7, style: 0.3 }
}

class ElevenLabsClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/elevenlabs') {
    this.baseUrl = baseUrl
  }

  /**
   * Generate speech from text using ElevenLabs TTS
   * Returns audio blob for playback
   */
  async speak(request: TTSSpeakRequest): Promise<Blob> {
    const traceId = generateTraceId()
    const startTime = Date.now()
    
    traceLogger.startTrace(traceId, 'POST', `${this.baseUrl}/tts`)
    
    try {
      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const durationMs = Date.now() - startTime
      traceLogger.endTrace(traceId, response.status, durationMs)

      if (!response.ok) {
        const errorData: ApiResponse<never> = await response.json().catch(() => ({ success: false as const, error: '' }))
        throw new Error(!errorData.success ? errorData.error : 'Failed to generate speech')
      }

      // Get the audio blob from the response
      return await response.blob()
    } catch (error) {
      traceLogger.error(traceId, error as Error)
      throw error
    }
  }

  /**
   * Play audio directly in browser.
   * Automatically derives tone params from turn number.
   */
  async playAudio(text: string, turn: number = 1): Promise<void> {
    const toneParams = getToneParams(turn)
    const audioBlob = await this.speak({ text, turn, ...toneParams })

    // Create audio object and play
    const audio = new Audio(URL.createObjectURL(audioBlob))
    await audio.play()

    // Clean up
    setTimeout(() => URL.revokeObjectURL(audio.src), 1000)
  }
}

// Singleton instance
export const elevenlabsClient = new ElevenLabsClient()
export default ElevenLabsClient
