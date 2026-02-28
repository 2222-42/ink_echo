import type { TTSSpeakRequest, ApiResponse } from './types'

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
  private activeAudio: HTMLAudioElement | null = null
  private activeAudioUrl: string | null = null

  constructor(baseUrl: string = '/api/elevenlabs') {
    this.baseUrl = baseUrl
  }

  /**
   * Clean up active audio playback and revoke object URL
   */
  private cleanupAudio(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause()
        this.activeAudio.src = ''
      } catch (e) {
        console.warn('Error cleaning up audio:', e)
      }
    }

    if (this.activeAudioUrl) {
      try {
        URL.revokeObjectURL(this.activeAudioUrl)
      } catch (e) {
        console.warn('Error revoking object URL:', e)
      }
    }

    this.activeAudio = null
    this.activeAudioUrl = null
  }

  /**
   * Generate speech from text using ElevenLabs TTS
   * Returns audio blob for playback
   */
  async speak(request: TTSSpeakRequest): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({ success: false as const, error: '' }))
      throw new Error(!errorData.success ? errorData.error : 'Failed to generate speech')
    }

    // Get the audio blob from the response
    return await response.blob()
  }

  /**
   * Play audio directly in browser.
   * Automatically derives tone params from turn number.
   */
  async playAudio(text: string, turn: number = 1): Promise<void> {
    // Clean up any previously playing audio
    this.cleanupAudio()

    const toneParams = getToneParams(turn)
    const audioBlob = await this.speak({ text, turn, ...toneParams })

    // Create audio object and play
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    
    // Track active audio for cleanup
    this.activeAudio = audio
    this.activeAudioUrl = audioUrl

    try {
      await audio.play()
    } catch (error) {
      // Clean up even if playback fails
      this.cleanupAudio()
      throw error
    }

    // Clean up after playback completes or after a timeout
    const cleanupTimeout = setTimeout(() => {
      this.cleanupAudio()
    }, 1000)

    // Also clean up when audio ends
    audio.addEventListener('ended', () => {
      clearTimeout(cleanupTimeout)
      this.cleanupAudio()
    }, { once: true })
  }

  /**
   * Clean up any active audio playback (called when component unmounts)
   */
  cleanup(): void {
    this.cleanupAudio()
  }
}

// Singleton instance
export const elevenlabsClient = new ElevenLabsClient()
export default ElevenLabsClient
