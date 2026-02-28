import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../../../api/elevenlabs/tts.js'

describe('ElevenLabs TTS API', () => {
  let mockResponse: any
  let mockRequest: VercelRequest

  beforeEach(() => {
    // Reset mock response for each test
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      write: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    }

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: '/api/elevenlabs/tts',
      headers: {},
      body: {
        text: 'Hello, this is a test message',
        turn: 1,
      },
    } as VercelRequest
  })

  it('should reject GET requests', async () => {
    mockRequest.method = 'GET'
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(405)
  })

  it('should reject requests without text', async () => {
    mockRequest.body = { turn: 1 }
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should reject requests with empty text', async () => {
    mockRequest.body = { text: '', turn: 1 }
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should set CORS headers', async () => {
    // Mock fetch to return a successful response with audio stream
    const mockStream = {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: undefined }),
      }),
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: mockStream,
      } as unknown as Response)
    )

    // Set API key for the test
    process.env.ELEVENLABS_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.setHeader).toHaveBeenCalled()
  })

  it('should set audio content type', async () => {
    // Mock fetch to return a successful response with audio stream
    const mockStream = {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: undefined }),
      }),
    }

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: mockStream,
      } as unknown as Response)
    )

    process.env.ELEVENLABS_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)

    // Check that audio content type was set
    const setHeaderCalls = mockResponse.setHeader.mock.calls
    const contentTypeCall = setHeaderCalls.find((call: any) => call[0] === 'Content-Type')
    expect(contentTypeCall).toBeTruthy()
    expect(contentTypeCall[1]).toBe('audio/mpeg')
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'TTS API error' }),
      } as unknown as Response)
    )

    process.env.ELEVENLABS_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(500)
  })

  it('should adjust voice settings for turns 5-7', async () => {
    // Mock fetch to capture the request body
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      } as unknown as Response)
    )

    global.fetch = mockFetch
    process.env.ELEVENLABS_API_KEY = 'test-key'

    // Test with turn 6 (should use more serious tone)
    mockRequest.body.turn = 6
    await handler(mockRequest, mockResponse as any)

    // Check that the fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalled()
    const requestBody = JSON.parse((mockFetch as any).mock.calls[0][1]?.body as string || '{}')
    expect(requestBody.voice_settings.stability).toBe(0.45)
    expect(requestBody.voice_settings.style).toBe(0.55)
  })

  it('should use default voice settings for turns 1-4', async () => {
    // Mock fetch to capture the request body
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined }),
          }),
        },
      } as unknown as Response)
    )

    global.fetch = mockFetch
    process.env.ELEVENLABS_API_KEY = 'test-key'

    // Test with turn 3 (should use calm tone)
    mockRequest.body.turn = 3
    await handler(mockRequest, mockResponse as any)

    // Check that the fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalled()
    const requestBody = JSON.parse((mockFetch as any).mock.calls[0][1]?.body as string || '{}')
    expect(requestBody.voice_settings.stability).toBe(0.5)
    expect(requestBody.voice_settings.style).toBe(0.3)
  })
})
