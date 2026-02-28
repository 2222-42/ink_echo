import { describe, it, expect, vi, beforeEach } from 'vitest'
import ElevenLabsClient, { elevenlabsClient } from './elevenlabsClient'
import type { TTSSpeakRequest } from './types'

describe('ElevenLabsClient', () => {
  let client: ElevenLabsClient
  let mockFetch: any

  beforeEach(() => {
    client = new ElevenLabsClient()
    mockFetch = vi.fn()
    global.fetch = mockFetch
    
    // Mock Audio constructor
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      src: '',
    }))
    
    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'mock-audio-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  describe('speak', () => {
    it('should send POST request to TTS endpoint', async () => {
      const request: TTSSpeakRequest = {
        text: 'Hello world',
        turn: 1,
      }

      const mockBlob = new Blob(['audio data'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const response = await client.speak(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/elevenlabs/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      expect(response).toBeInstanceOf(Blob)
    })

    it('should throw error when TTS generation fails', async () => {
      const request: TTSSpeakRequest = {
        text: 'Hello',
      }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'TTS error',
          code: 'API_ERROR',
          success: false,
        }),
      })

      await expect(client.speak(request)).rejects.toThrow('TTS error')
    })

    it('should include turn parameter in request', async () => {
      const request: TTSSpeakRequest = {
        text: 'Hello',
        turn: 3,
      }

      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      await client.speak(request)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.turn).toBe(3)
    })
  })

  describe('playAudio', () => {
    it('should generate and play audio', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      await client.playAudio('Hello', 2)

      expect(mockFetch).toHaveBeenCalled()
      expect(global.Audio).toHaveBeenCalledWith('mock-audio-url')
      expect(global.Audio.mock.results[0].value.play).toHaveBeenCalled()
    })

    it('should handle errors during playback', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'Playback error',
          success: false,
        }),
      })

      await expect(client.playAudio('Hello')).rejects.toThrow('Playback error')
    })
  })

  describe('singleton', () => {
    it('should provide singleton instance', () => {
      expect(elevenlabsClient).toBeInstanceOf(ElevenLabsClient)
    })
  })
})
