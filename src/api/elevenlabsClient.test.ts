import { describe, it, expect, vi, beforeEach } from 'vitest'
import ElevenLabsClient, { elevenlabsClient, getToneParams } from './elevenlabsClient'
import type { TTSSpeakRequest } from './types'

describe('ElevenLabsClient', () => {
  let client: ElevenLabsClient
  let mockFetch: any

  beforeEach(() => {
    client = new ElevenLabsClient()
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // Mock Audio constructor
    global.Audio = vi.fn().mockImplementation(function() {
      return {
        play: vi.fn().mockResolvedValue(undefined),
        src: '',
        pause: vi.fn(),
        addEventListener: vi.fn(),
      }
    })

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

    it('should clean up previous audio when playing new audio', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      // First playback
      await client.playAudio('First', 1)
      expect(global.Audio).toHaveBeenCalledTimes(1)
      
      // Second playback should clean up first
      await client.playAudio('Second', 2)
      expect(global.Audio).toHaveBeenCalledTimes(2)
      
      // Verify cleanup was called (revokeObjectURL should be called)
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should clean up audio on error', async () => {
      // First successful playback
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      await client.playAudio('First', 1)
      
      // Second playback with error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'Playback error',
          success: false,
        }),
      })

      await expect(client.playAudio('Error')).rejects.toThrow('Playback error')
      
      // Verify cleanup was called even on error
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should clean up active audio', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      await client.playAudio('Hello', 1)
      
      // Verify audio is active
      expect(client['activeAudio']).not.toBeNull()
      expect(client['activeAudioUrl']).not.toBeNull()

      // Call cleanup
      client.cleanup()
      
      // Verify cleanup
      expect(client['activeAudio']).toBeNull()
      expect(client['activeAudioUrl']).toBeNull()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle cleanup when no audio is playing', () => {
      // Should not throw error
      expect(() => client.cleanup()).not.toThrow()
    })
  })

  describe('singleton', () => {
    it('should provide singleton instance', () => {
      expect(elevenlabsClient).toBeInstanceOf(ElevenLabsClient)
    })
  })

  describe('getToneParams', () => {
    it('returns calm params for turns 1-4', () => {
      expect(getToneParams(1)).toEqual({ stability: 0.7, style: 0.3 })
      expect(getToneParams(4)).toEqual({ stability: 0.7, style: 0.3 })
    })

    it('returns mid params for turns 5-6', () => {
      expect(getToneParams(5)).toEqual({ stability: 0.55, style: 0.45 })
      expect(getToneParams(6)).toEqual({ stability: 0.55, style: 0.45 })
    })

    it('returns emotional params for turn 7+', () => {
      expect(getToneParams(7)).toEqual({ stability: 0.45, style: 0.55 })
      expect(getToneParams(10)).toEqual({ stability: 0.45, style: 0.55 })
    })
  })

  describe('playAudio tone injection', () => {
    it('sends stability and style in the request body based on turn', async () => {
      const mockBlob = new Blob(['audio'], { type: 'audio/mpeg' })
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      await client.playAudio('Turn 5 text', 5)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.stability).toBe(0.55)
      expect(requestBody.style).toBe(0.45)
    })
  })
})
