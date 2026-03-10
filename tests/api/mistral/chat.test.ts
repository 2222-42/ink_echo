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

  it('should include turn-specific instructions when turn >= 5', async () => {
    // Mock fetch to track the sent payload
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'Test response', role: 'assistant' },
          }],
        }),
      } as unknown as Response)
    )
    global.fetch = fetchMock

    process.env.MISTRAL_API_KEY = 'test-key'
    mockRequest.body.turn = 7

    await handler(mockRequest, mockResponse as any)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const callArgs = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit | undefined]
    const requestOptions = callArgs[1] || {}
    const bodyText = (requestOptions.body || '') as string

    // Expect the system prompt inside the body to contain the final turn instruction
    expect(bodyText).toContain('This is the final turn. Do NOT ask a question.')
    expect(bodyText).not.toContain('exactly TWO sentences')
  })

  it('should immediately return session ended message for turn 8+ without calling Mistral API', async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock

    mockRequest.body.turn = 8

    await handler(mockRequest, mockResponse as any)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      content: 'The session has ended. Please upload your card.',
      role: 'assistant',
      success: true
    })
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
