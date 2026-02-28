import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withCors, withErrorHandling, withRequestValidation, withTracing } from '../middleware.js'
import { API_CONFIG, type ApiResponse } from '../config.js'

interface TTSEndpoint {
  text: string
  turn?: number
  voice_id?: string
  model?: string
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED', success: false })
    return
  }

  const { text, turn = 1, voice_id, model = 'eleven_multilingual_v2' }: TTSEndpoint = req.body

  // Validate request
  if (!text || typeof text !== 'string' || text.trim() === '') {
    res.status(400).json({ error: 'Text is required', code: API_CONFIG.ERROR_CODES.INVALID_REQUEST, success: false })
    return
  }

  try {
    // Determine voice settings based on turn number
    // SPEC-19: Turns 1-4: calm, supportive tone
    // SPEC-20: Turns 5-7: more serious, urgent tone
    let stability = 0.5
    let style = 0.3

    if (turn >= 5 && turn <= 7) {
      stability = 0.45
      style = 0.55
    }

    // Use default English voice or specified voice
    const actualVoiceId = voice_id || '21m00Tcm4TlvDq8ikWAM' // English female voice (Rachel)

    // Call ElevenLabs TTS API
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + actualVoiceId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text: text,
        model_id: model,
        voice_settings: {
          stability: stability,
          style: style,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ElevenLabs API error')
    }

    // Stream the audio response back to client
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-cache')

    // Pipe the response stream
    const audioStream = response.body
    if (!audioStream) {
      throw new Error('No audio stream received')
    }

    // Create a transform stream to handle the audio data
    const reader = audioStream.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }

    res.end()
  } catch (error) {
    console.error('TTS API Error:', error)
    if (res.headersSent) {
      if (!res.writableEnded) {
        res.end()
      }
    } else {
      const errorResponse: ApiResponse<never> = {
        error: error instanceof Error ? error.message : 'Failed to generate speech',
        code: API_CONFIG.ERROR_CODES.API_ERROR,
        success: false,
      }
      res.status(500).json(errorResponse)
    }
  }
}

export default withTracing(withCors(withErrorHandling(withRequestValidation(handler))))
