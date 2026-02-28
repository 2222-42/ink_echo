import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors, withErrorHandling, withRequestValidation } from '../middleware'
import { API_CONFIG, type ApiResponse } from '../config'
import { getSystemPrompt } from './prompts'

interface VisionRequest {
  image: string // Base64 encoded image
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  turn?: number
}

interface MistralVisionResponse {
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

  const { image, messages, turn = 1 }: VisionRequest = req.body

  // Validate request
  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Image (base64) is required', code: API_CONFIG.ERROR_CODES.INVALID_REQUEST, success: false })
    return
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required', code: API_CONFIG.ERROR_CODES.INVALID_REQUEST, success: false })
    return
  }

  try {
    // Get system prompt for vision
    const systemPrompt = getSystemPrompt('vision')

    // Call Mistral Vision API
    // Note: Mistral's vision API requires the image to be sent as a base64 encoded string
    // in the messages array with proper image URL format
    const visionMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this handwritten note and extract the following information:' },
          { 
            type: 'image_url', 
            image_url: { 
              url: `data:image/png;base64,${image.split(',')[1] || image}` 
            } 
          }
        ]
      }
    ]

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b',
        messages: visionMessages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Mistral Vision API error')
    }

    const mistralData: MistralVisionResponse = await response.json()

    // Extract the assistant's response
    const assistantMessage = mistralData.choices[0]?.message
    
    if (!assistantMessage) {
      throw new Error('No response from Mistral Vision API')
    }

    // Parse the JSON response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(assistantMessage.content)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      throw new Error('Failed to parse vision analysis result')
    }

    // Return successful response with structured data
    const apiResponse: ApiResponse<typeof parsedResponse> = {
      data: parsedResponse,
      success: true,
    }

    res.status(200).json(apiResponse)
  } catch (error) {
    console.error('Vision API Error:', error)
    const errorResponse: ApiResponse<never> = {
      error: error instanceof Error ? error.message : 'Failed to process vision request',
      code: API_CONFIG.ERROR_CODES.API_ERROR,
      success: false,
    }
    res.status(500).json(errorResponse)
  }
}

export default withCors(withErrorHandling(withRequestValidation(handler)))
