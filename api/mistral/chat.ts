import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors, withErrorHandling, withRequestValidation } from '../middleware'
import { API_CONFIG, type ApiResponse } from '../config'
import { getSystemPrompt } from './prompts'

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  turn?: number
}

interface MistralChatResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED', success: false })
    return
  }

  const { messages, turn = 1 }: ChatRequest = req.body

  // Validate request
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required', code: API_CONFIG.ERROR_CODES.INVALID_REQUEST, success: false })
    return
  }

  try {
    // Get system prompt
    const systemPrompt = getSystemPrompt('chat')

    // Prepare messages for Mistral API
    const mistralMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    // Call Mistral API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: mistralMessages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Mistral API error')
    }

    const mistralData: MistralChatResponse = await response.json()

    // Extract the assistant's response
    const assistantMessage = mistralData.choices[0]?.message
    
    if (!assistantMessage) {
      throw new Error('No response from Mistral API')
    }

    // Return successful response
    const apiResponse: ApiResponse<{ content: string }> = {
      data: { content: assistantMessage.content },
      success: true,
    }

    res.status(200).json(apiResponse)
  } catch (error) {
    console.error('Chat API Error:', error)
    const errorResponse: ApiResponse<never> = {
      error: error instanceof Error ? error.message : 'Failed to process chat request',
      code: API_CONFIG.ERROR_CODES.API_ERROR,
      success: false,
    }
    res.status(500).json(errorResponse)
  }
}

export default withCors(withErrorHandling(withRequestValidation(handler)))
