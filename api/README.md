# Ink Echo API Documentation

This directory contains the Vercel Serverless Functions that serve as the backend for the Ink Echo application.

## Overview

The API provides secure proxies to external services (Mistral AI and ElevenLabs) to hide API keys and provide consistent error handling.

## Endpoints

### Health Check

**GET** `/api/hello`

Returns a simple health check response.

**Response:**
```json
{
  "message": "Hello, Ink Echo!"
}
```

### Mistral Chat API

**POST** `/api/mistral/chat`

Proxies requests to Mistral's chat API with system prompts injected server-side.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "turn": 1
}
```

**Response:**
```json
{
  "data": {
    "content": "I'm doing well, thank you for asking. How can I help you reflect on your ideas today?"
  },
  "success": true
}
```

**Error Response:**
```json
{
  "error": "error message",
  "code": "ERROR_CODE",
  "success": false
}
```

### Mistral Vision API

**POST** `/api/mistral/vision`

Proxies requests to Mistral's vision API for analyzing handwritten notes.

**Request Body:**
```json
{
  "image": "data:image/png;base64,...",
  "messages": [
    {
      "role": "user",
      "content": "Analyze this note"
    }
  ],
  "turn": 1
}
```

**Response:**
```json
{
  "data": {
    "text": "extracted handwritten text",
    "themes": ["theme1", "theme2", "theme3"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "main_idea": "summary of the main point",
    "connections": ["possible connection to previous conversation"],
    "feedback": "positive feedback about the note"
  },
  "success": true
}
```

### ElevenLabs TTS API

**POST** `/api/elevenlabs/tts`

Proxies requests to ElevenLabs' text-to-speech API with dynamic voice settings based on turn number.

**Request Body:**
```json
{
  "text": "Hello, this is a test message",
  "turn": 1,
  "voice_id": "optional_custom_voice_id"
}
```

**Response:**
- Audio stream (MP3 format)
- Content-Type: `audio/mpeg`

**Voice Settings:**
- **Turns 1-4**: Calm, supportive tone (stability: 0.5, style: 0.3)
- **Turns 5-7**: More serious, urgent tone (stability: 0.45, style: 0.55)

## Environment Variables

Required environment variables (set in `.env.local` or Vercel dashboard):

```env
MISTRAL_API_KEY=your_mistral_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Development

### Local Development

To test locally, use Vercel's development server:

```bash
npx vercel dev
```

This will start a local server with all API endpoints available at `http://localhost:3000/api/*`.

### Testing

Run tests using:

```bash
npm test
# or
npx vitest
```

## Security

- All API keys are stored in environment variables
- System prompts are stored server-side to prevent injection attacks
- Input validation is performed on all endpoints
- Error messages don't expose sensitive information
- CORS is properly configured

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "descriptive error message",
  "code": "ERROR_CODE",
  "success": false
}
```

Error codes:
- `INVALID_REQUEST`: Missing or invalid request data
- `MISSING_API_KEY`: Required API key not configured
- `API_ERROR`: Error from external API
- `INTERNAL_ERROR`: Server-side error

## System Prompts

System prompts are defined in `api/mistral/prompts.ts` and follow the specifications:

- **CHAT_SYSTEM_PROMPT**: Encourages thoughtful reflection and handwriting (SPEC-08)
- **VISION_SYSTEM_PROMPT**: Extracts structured information from handwritten notes (SPEC-15)

## Deployment

To deploy to Vercel:

```bash
vercel
```

Make sure to configure the environment variables in the Vercel dashboard.

## File Structure

```
api/
├── hello.ts                  # Health check endpoint
├── config.ts                 # API configuration and types
├── middleware.ts             # Reusable middleware (CORS, validation, error handling)
├── mistral/
│   ├── prompts.ts            # System prompts for Mistral API
│   ├── chat.ts               # Chat API proxy
│   └── vision.ts             # Vision API proxy
└── elevenlabs/
    └── tts.ts                # TTS API proxy
```

## Testing Scripts

- `test-api-foundation.sh`: Tests the foundation components
- `test-mistral-api.sh`: Tests Mistral API endpoints
- `test-elevenlabs-api.sh`: Tests ElevenLabs TTS endpoint
- `test-track3-complete.sh`: Comprehensive test for entire Track 3

Run all tests:
```bash
./test-track3-complete.sh
```
