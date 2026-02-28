import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../../../api/mistral/vision.js'

describe('Mistral Vision API', () => {
  let mockResponse: any
  let mockRequest: VercelRequest

  beforeEach(() => {
    // Reset mock response for each test
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    }

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: '/api/mistral/vision',
      headers: {},
      body: {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        messages: [
          { role: 'user', content: 'Analyze this image' },
        ],
      },
    } as VercelRequest
  })

  it('should reject GET requests', async () => {
    mockRequest.method = 'GET'
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(405)
  })

  it('should reject requests without image', async () => {
    mockRequest.body = { messages: [{ role: 'user', content: 'Test' }] }
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should reject requests without messages', async () => {
    mockRequest.body = { image: 'data:image/png;base64,test' }
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should set CORS headers', async () => {
    // Mock fetch to return a successful response with JSON
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: '{"text":"test text","themes":["theme1"],"keywords":["key1"],"main_idea":"test","connections":[],"feedback":"good"}',
              role: 'assistant'
            },
          }],
        }),
      } as unknown as Response)
    )

    // Set API key for the test
    process.env.MISTRAL_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.setHeader).toHaveBeenCalled()
  })

  it('should parse JSON response correctly', async () => {
    // Mock fetch to return a successful response with JSON
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: '{"text":"extracted text","themes":["theme1","theme2"],"keywords":["key1","key2"],"main_idea":"main idea","connections":["connection1"],"feedback":"great work"}',
              role: 'assistant'
            },
          }],
        }),
      } as unknown as Response)
    )

    global.fetch = mockFetch
    process.env.MISTRAL_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)

    // Check that the response contains parsed JSON data
    const jsonCall = mockResponse.json.mock.calls[0][0]
    expect(jsonCall.success).toBe(true)
    expect(jsonCall.data).toHaveProperty('text')
    expect(jsonCall.data).toHaveProperty('themes')
    expect(jsonCall.data).toHaveProperty('keywords')

    // Verify that the image was properly included in the request
    expect(mockFetch).toHaveBeenCalled()
    const requestBody = JSON.parse((mockFetch as any).mock.calls[0][1]?.body as string || '{}')
    expect(requestBody.messages).toHaveLength(3) // system + history message + user with image
    expect(requestBody.messages[2].content).toBeInstanceOf(Array)
    expect(requestBody.messages[2].content[0]).toHaveProperty('type', 'text')
    expect(requestBody.messages[2].content[1]).toHaveProperty('image_url')
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Vision API error' }),
      } as unknown as Response)
    )

    process.env.MISTRAL_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(500)
  })

  it('should use fallback mode when feature flag is enabled', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Vision API error' }),
      } as unknown as Response)
    )

    process.env.MISTRAL_API_KEY = 'test-key'
    process.env.ENABLE_VISION_FALLBACK = 'true'

    await handler(mockRequest, mockResponse as any)

    // Should return 200 with fallback response instead of 500 error
    expect(mockResponse.status).toHaveBeenCalledWith(200)

    // Check that response contains feedback field
    const jsonCall = mockResponse.json.mock.calls[0][0]
    expect(jsonCall.success).toBe(true)
    expect(jsonCall.data).toHaveProperty('feedback')
    expect(typeof jsonCall.data.feedback).toBe('string')
    expect(jsonCall.data.feedback.length).toBeGreaterThan(0)

    // Clean up
    delete process.env.ENABLE_VISION_FALLBACK
  })

  it('should return error when feature flag is disabled (default)', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Vision API error' }),
      } as unknown as Response)
    )

    process.env.MISTRAL_API_KEY = 'test-key'
    // Explicitly disable fallback
    delete process.env.ENABLE_VISION_FALLBACK

    await handler(mockRequest, mockResponse as any)

    // Should return 500 error
    expect(mockResponse.status).toHaveBeenCalledWith(500)

    // Check that response is an error
    const jsonCall = mockResponse.json.mock.calls[0][0]
    expect(jsonCall.success).toBe(false)
    expect(jsonCall).toHaveProperty('error')
  })
})
