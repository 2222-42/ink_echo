import type { TTSSpeakRequest, ApiResponse } from './types'

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
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData: ApiResponse<never> = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to generate speech')
    }

    // Get the audio blob from the response
    return await response.blob()
  }

  /**
   * Play audio directly in browser
   */
  async playAudio(text: string, turn: number = 1): Promise<void> {
    const audioBlob = await this.speak({ text, turn })
    
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
