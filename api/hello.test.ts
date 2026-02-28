import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './hello'

// Mock VercelResponse
describe('API Hello Endpoint', () => {
  let mockResponse: any
  let mockRequest: VercelRequest

  beforeAll(() => {
    // Setup mock request
    mockRequest = {
      method: 'GET',
      url: '/api/hello',
      headers: {},
      body: null,
    } as VercelRequest
  })

  beforeEach(() => {
    // Reset mock response for each test
    mockResponse = {
      statusCode: 0,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    }
  })

  it('should return 200 status code', async () => {
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
  })

  it('should return correct JSON response', async () => {
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Hello, Ink Echo!' })
  })

  it('should handle GET requests', async () => {
    mockRequest.method = 'GET'
    await handler(mockRequest, mockResponse as any)
    expect(mockResponse.statusCode).toBe(200)
  })
})
