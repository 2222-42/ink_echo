import { describe, it, expect, vi, beforeEach } from 'vitest'
import { traceLogger, generateTraceId, type TraceMetadata } from './tracing'

describe('Tracing', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('generateTraceId', () => {
    it('should generate unique trace IDs', () => {
      const id1 = generateTraceId()
      const id2 = generateTraceId()
      
      expect(id1).toMatch(/^trace_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^trace_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('TraceLogger', () => {
    it('should log trace metadata', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const metadata: TraceMetadata = {
        traceId: 'test-trace-123',
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/test',
        statusCode: 200,
        durationMs: 100,
      }
      
      traceLogger.log(metadata)
      
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.any(String))
      
      consoleSpy.mockRestore()
    })

    it('should track trace start', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      traceLogger.startTrace('test-trace-123', 'POST', '/api/test')
      
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE:START]', expect.stringContaining('test-trace-123'))
      
      consoleSpy.mockRestore()
    })

    it('should track trace end', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      traceLogger.startTrace('test-trace-123', 'POST', '/api/test')
      traceLogger.endTrace('test-trace-123', 200, 100)
      
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('200'))
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('100'))
      
      consoleSpy.mockRestore()
    })

    it('should track errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const error = new Error('Test error')
      traceLogger.startTrace('test-trace-123', 'POST', '/api/test')
      traceLogger.error('test-trace-123', error)
      
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('Test error'))
      
      consoleSpy.mockRestore()
    })

    it('should handle string errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      traceLogger.startTrace('test-trace-123', 'POST', '/api/test')
      traceLogger.error('test-trace-123', 'String error')
      
      expect(consoleSpy).toHaveBeenCalledWith('[TRACE]', expect.stringContaining('String error'))
      
      consoleSpy.mockRestore()
    })
  })
})
