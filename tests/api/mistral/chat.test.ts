import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../../../api/mistral/chat.js'

describe('Mistral Chat API', () => {
  let mockResponse: any
  let mockRequest: VercelRequest

  beforeEach(() => {
    // Reset mock response for each test
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    }

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: '/api/mistral/chat',
      headers: {},
      body: {
        messages: [
          { role: 'user', content: 'Hello, how are you?' },
        ],
      },
    } as VercelRequest
  })

  it('should reject GET requests', async () => {
    mockRequest.method = 'GET'
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(405)
  })

  it('should reject requests without messages', async () => {
    mockRequest.body = {}
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should reject requests with empty messages array', async () => {
    mockRequest.body = { messages: [] }
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should set CORS headers', async () => {
    // Mock fetch to return a successful response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'Test response', role: 'assistant' },
          }],
        }),
      } as unknown as Response)
    )

    // Set API key for the test
    process.env.MISTRAL_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.setHeader).toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API error' }),
      } as unknown as Response)
    )

    process.env.MISTRAL_API_KEY = 'test-key'

    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(500)
  })
})
