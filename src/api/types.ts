// API Client Types

export interface ApiError {
  error: string
  code: string
  success: false
}

export interface ApiSuccessResponse<T> {
  data: T
  success: true
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiError

// Mistral API Types
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  turn?: number
}

export interface ChatResponse {
  content: string
}

export interface VisionRequest {
  image: string // Base64 encoded image
  messages: ChatMessage[]
  turn?: number
}

export interface VisionResponse {
  text: string
  themes: string[]
  keywords: string[]
  main_idea: string
  connections: string[]
  feedback: string
}

// ElevenLabs API Types
export interface TTSSpeakRequest {
  text: string
  turn?: number
  voiceId?: string
  stability?: number
  style?: number
}

// Audio Types
export interface AudioPlayback {
  audioBlob: Blob
  audioUrl: string
  play: () => Promise<void>
  stop: () => void
}

export interface RecordingState {
  isRecording: boolean
  isListening: boolean
  transcript: string
}
