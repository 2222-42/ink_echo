import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withTracing } from '../../../api/middleware.js'

describe('withTracing middleware', () => {
  let mockRequest: VercelRequest
  let mockResponse: any
  let mockHandler: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup mock request
    mockRequest = {
      method: 'POST',
      url: '/api/test',
      headers: {},
      body: { test: 'data' },
    } as VercelRequest

    // Setup mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      statusCode: 200,
    }

    // Setup mock handler
    mockHandler = vi.fn(async (req: VercelRequest, res: VercelResponse) => {
      res.statusCode = 200
      res.json({ success: true, data: { test: 'response' } })
    })
  })

  it('should add traceId to request', async () => {
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    expect((mockRequest as any).traceId).toBeDefined()
    expect((mockRequest as any).traceId).toMatch(/^trace_\d+_[a-z0-9]+$/)
  })

  it('should log trace metadata on request start', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    // Should log trace start with method and path
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('POST'))
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('/api/test'))
    
    consoleSpy.mockRestore()
  })

  it('should log trace metadata on request end', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    // Should log trace end with duration and status
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('durationMs'))
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('statusCode'))
    
    consoleSpy.mockRestore()
  })

  it('should intercept response.json to log metadata', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const originalJsonMock = mockResponse.json
    
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    // Verify that trace metadata was logged (the middleware intercepts json)
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('statusCode'))
    
    consoleSpy.mockRestore()
  })

  it('should log error metadata on handler error', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorHandler = vi.fn(async () => {
      throw new Error('Test error')
    })
    
    const tracedHandler = withTracing(errorHandler)
    
    await expect(tracedHandler(mockRequest, mockResponse)).rejects.toThrow('Test error')
    
    // Should log error trace
    expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('Test error'))
    
    consoleSpy.mockRestore()
  })

  it('should include metadata about success/error in trace', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    mockHandler = vi.fn(async (req: VercelRequest, res: VercelResponse) => {
      res.statusCode = 400
      res.json({ success: false, error: 'Validation error' })
    })
    
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    // Should log metadata with success flag
    const logCalls = consoleSpy.mock.calls
    const endTraceCalls = logCalls.filter((call) => 
      call[0] === '[TRACE]' && call[1].includes('success')
    )
    
    expect(endTraceCalls.length).toBeGreaterThan(0)
    
    consoleSpy.mockRestore()
  })

  it('should measure request duration', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Add delay to handler
    mockHandler = vi.fn(async (req: VercelRequest, res: VercelResponse) => {
      await new Promise(resolve => setTimeout(resolve, 10))
      res.statusCode = 200
      res.json({ success: true })
    })
    
    const tracedHandler = withTracing(mockHandler)
    await tracedHandler(mockRequest, mockResponse)
    
    // Find the trace log with duration
    const logCalls = consoleSpy.mock.calls
    const durationLog = logCalls.find((call) => 
      call[0] === '[TRACE]' && call[1].includes('durationMs')
    )
    
    expect(durationLog).toBeDefined()
    
    consoleSpy.mockRestore()
  })
})
