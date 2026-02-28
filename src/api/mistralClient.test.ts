import { describe, it, expect, vi, beforeEach } from 'vitest'
import MistralClient, { mistralClient } from './mistralClient'
import type { ChatRequest, VisionRequest } from './types'

describe('MistralClient', () => {
  let client: MistralClient
  let mockFetch: any

  beforeEach(() => {
    client = new MistralClient()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('chat', () => {
    it('should send POST request to chat endpoint', async () => {
      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        turn: 1,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { content: 'Response from Mistral' },
          success: true,
        }),
      })

      const response = await client.chat(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/mistral/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      expect(response).toEqual({ content: 'Response from Mistral' })
    })

    it('should throw error when response is not successful', async () => {
      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'API error',
          code: 'API_ERROR',
          success: false,
        }),
      })

      await expect(client.chat(request)).rejects.toThrow('API error')
    })

    it('should not include system prompt in request', async () => {
      const request: ChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { content: 'Response' },
          success: true,
        }),
      })

      await client.chat(request)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.messages).toHaveLength(1)
      expect(requestBody.messages[0].role).toBe('user')
      expect(requestBody.messages[0].content).toBe('Hello')
    })
  })

  describe('vision', () => {
    it('should send POST request to vision endpoint with image', async () => {
      const request: VisionRequest = {
        image: 'data:image/png;base64,test',
        messages: [{ role: 'user', content: 'Analyze this' }],
        turn: 1,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            text: 'Extracted text',
            themes: ['theme1'],
            keywords: ['key1'],
            main_idea: 'Main idea',
            connections: [],
            feedback: 'Good',
          },
          success: true,
        }),
      })

      const response = await client.vision(request)

      expect(mockFetch).toHaveBeenCalledWith('/api/mistral/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      expect(response).toEqual({
        text: 'Extracted text',
        themes: ['theme1'],
        keywords: ['key1'],
        main_idea: 'Main idea',
        connections: [],
        feedback: 'Good',
      })
    })

    it('should throw error when vision analysis fails', async () => {
      const request: VisionRequest = {
        image: 'data:image/png;base64,test',
        messages: [{ role: 'user', content: 'Analyze' }],
      }

      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'Vision API error',
          code: 'API_ERROR',
          success: false,
        }),
      })

      await expect(client.vision(request)).rejects.toThrow('Vision API error')
    })
  })

  describe('singleton', () => {
    it('should provide singleton instance', () => {
      expect(mistralClient).toBeInstanceOf(MistralClient)
    })
  })
})
