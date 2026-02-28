import { useState, useRef, useEffect, useCallback } from 'react'
import { elevenlabsClient } from '../api/elevenlabsClient'
import type { RecordingState } from '../api/types'

interface UseAudioOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: Error) => void
}

export function useAudio(options: UseAudioOptions = {}) {
  const { onTranscript, onError } = options

  // Refs for callbacks to avoid re-initializing SpeechRecognition
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)

  // Ref to debounce identical final transcripts
  const lastTranscriptRef = useRef<string | null>(null)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onErrorRef.current = onError
  }, [onTranscript, onError])

  // State management
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isListening: false,
    transcript: '',
  })

  // Refs for state that's needed in event handlers
  const isRecordingRef = useRef(state.isRecording)
  const transcriptRef = useRef(state.transcript)

  useEffect(() => {
    isRecordingRef.current = state.isRecording
    transcriptRef.current = state.transcript
  }, [state.isRecording, state.transcript])

  // Ref for Web Speech API
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ja-JP'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        const displayTranscript = finalTranscript || interimTranscript
        setState(prev => ({ ...prev, transcript: displayTranscript }))

        // Invoke callback on FINAL results
        if (finalTranscript) {
          const text = finalTranscript.trim()
          if (text && text !== lastTranscriptRef.current) {
            lastTranscriptRef.current = text
            onTranscriptRef.current?.(text)
          }
          setState(prev => ({ ...prev, transcript: '' }))
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)

        // Handle spurious network errors by retrying under the hood
        if (event.error === 'network' && isRecordingRef.current) {
          console.warn('Network error encountered, attempting to reconnect in 1s...')
          // We do NOT set isRecording: false here so the UI doesn't drop
          setTimeout(() => {
            if (isRecordingRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch (e) { /* ignore */ }
            }
          }, 1000)
          return
        }

        setState(prev => ({ ...prev, isRecording: false, isListening: false }))
        onErrorRef.current?.(new Error(event.error))
      }

      recognition.onend = () => {
        // Use the ref to capture the latest state without closure pitfalls
        if (isRecordingRef.current) {
          try {
            recognitionRef.current?.start()
          } catch (e) { /* ignore already started error */ }
        }
      }

      recognitionRef.current = recognition
    } else {
      console.warn('Speech recognition not supported in this browser')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, []) // Empty dependency array ensures it's not torn down prematurely

  /**
   * Start recording audio and transcribing to text
   */
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      onErrorRef.current?.(new Error('Speech recognition not supported'))
      return false
    }

    try {
      recognitionRef.current.start()
      lastTranscriptRef.current = null // Reset debounce tracker on new recording
      setState(prev => ({ ...prev, isRecording: true, isListening: true, transcript: '' }))
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      onErrorRef.current?.(error instanceof Error ? error : new Error('Failed to start recording'))
      return false
    }
  }, [])

  /**
   * Stop recording and return the transcript
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setState(prev => ({ ...prev, isRecording: false, isListening: false }))

      // If we manually stopped, we might have some pending transcript
      const pendingText = transcriptRef.current.trim()
      if (pendingText && pendingText !== lastTranscriptRef.current) {
        lastTranscriptRef.current = pendingText
        onTranscriptRef.current?.(pendingText)
      }
    }
    return transcriptRef.current
  }, [])

  /**
   * Play text as speech using ElevenLabs
   */
  const playText = useCallback(async (text: string, turn: number = 1) => {
    try {
      await elevenlabsClient.playAudio(text, turn)
    } catch (error) {
      console.error('Failed to play audio:', error)
      onErrorRef.current?.(error instanceof Error ? error : new Error('Failed to play audio'))
      throw error
    }
  }, [])

  /**
   * Check if browser supports speech recognition
   */
  const isSpeechRecognitionSupported = useCallback(() => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }, [])

  return {
    // State
    isRecording: state.isRecording,
    isListening: state.isListening,
    transcript: state.transcript,

    // Actions
    startRecording,
    stopRecording,
    playText,

    // Utilities
    isSpeechRecognitionSupported,

    // Getters
    getTranscript: () => state.transcript,
  }
}

export default useAudio
