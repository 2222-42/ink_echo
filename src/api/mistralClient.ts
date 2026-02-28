import type { 
  ChatRequest, 
  ChatResponse, 
  VisionRequest, 
  VisionResponse, 
  ApiResponse 
} from './types'

class MistralClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/mistral') {
    this.baseUrl = baseUrl
  }

  /**
   * Send a chat message to Mistral API
   * System prompt is injected server-side
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data: ApiResponse<ChatResponse> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to get chat response')
    }

    return data.data
  }

  /**
   * Analyze an image using Mistral Vision API
   * Returns structured analysis of handwritten content
   */
  async vision(request: VisionRequest): Promise<VisionResponse> {
    const response = await fetch(`${this.baseUrl}/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    const data: ApiResponse<VisionResponse> = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to analyze image')
    }

    return data.data
  }
}

// Singleton instance
export const mistralClient = new MistralClient()
export default MistralClient
