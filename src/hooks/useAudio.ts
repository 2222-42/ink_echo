import { useState, useRef, useEffect } from 'react'
import { elevenlabsClient } from '../api/elevenlabsClient'
import type { RecordingState } from '../api/types'

interface UseAudioOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: Error) => void
}

export function useAudio(options: UseAudioOptions = {}) {
  const { onTranscript, onError } = options

  // State management
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isListening: false,
    transcript: '',
  })

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

        // Update display state for interim (for live display)
        const displayTranscript = finalTranscript || interimTranscript
        setState(prev => ({ ...prev, transcript: displayTranscript }))
        // Only invoke onTranscript callback for FINAL results to avoid duplicate API calls
        if (finalTranscript) {
          onTranscript?.(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setState(prev => ({ ...prev, isRecording: false, isListening: false }))
        onError?.(new Error(event.error))
      }

      recognition.onend = () => {
        if (state.isRecording) {
          recognition.start()
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
  }, [state.isRecording, onTranscript, onError])

  /**
   * Start recording audio and transcribing to text
   */
  const startRecording = () => {
    if (!recognitionRef.current) {
      onError?.(new Error('Speech recognition not supported'))
      return false
    }

    try {
      recognitionRef.current.start()
      setState(prev => ({ ...prev, isRecording: true, isListening: true }))
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to start recording'))
      return false
    }
  }

  /**
   * Stop recording and return the transcript
   */
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setState(prev => ({ ...prev, isRecording: false, isListening: false }))
    }
    return state.transcript
  }

  /**
   * Play text as speech using ElevenLabs
   */
  const playText = async (text: string, turn: number = 1) => {
    try {
      await elevenlabsClient.playAudio(text, turn)
    } catch (error) {
      console.error('Failed to play audio:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to play audio'))
      throw error
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

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
