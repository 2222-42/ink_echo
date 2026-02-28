import { useState } from 'react'
import { useConversation } from './hooks/useConversation'
import { useAudio } from './hooks/useAudio'
import { mistralClient } from './api/mistralClient'
import { MicButton } from './components/MicButton'
import { ConversationLog } from './components/ConversationLog'
import { EndMessageOverlay } from './components/EndMessageOverlay'
import { UploadArea } from './components/UploadArea'
import { isFeatureEnabled, getMaxTurns } from './lib/featureFlags'
import { getHonestErrorMessage, getHonestErrorUIMessage } from '../api/mistral/fallback'
import './App.css'

function App() {
  const {
    turns,
    history,
    isSessionEnded,
    isWaitingVision,
    addMessage,
    startUploadMode,
    resumeSessionWithVision
  } = useConversation()

  // Fix 2: loading and error state
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const {
    isRecording,
    startRecording,
    stopRecording,
    playText
  } = useAudio({
    // Fix 1: onTranscript now only fires for final results (handled in useAudio.ts)
    onTranscript: async (transcript) => {
      setErrorMessage(null)
      addMessage('user', transcript)
      setIsProcessing(true)
      try {
        const response = await mistralClient.chat({
          messages: [...history, { role: 'user', content: transcript }],
          turn: turns + 1
        })
        addMessage('assistant', response.content)
        await playText(response.content, turns + 1)
      } catch (error) {
        console.error('Failed to get chat response:', error)
        setErrorMessage('Please try speaking again.')
        // Error speech feedback per spec [error_speech.spec.md AC-2]
        try { await playText('Things seem a bit busy right now. Please try talking to me again.', 1) } catch { /* ignore */ }
      } finally {
        setIsProcessing(false)
      }
    },
    onError: async (error) => {
      console.error('Audio error:', error)
      if (error.message === 'not-allowed') {
        // STT permission denied — play mic prompt [error_speech.spec.md AC-1]
        setErrorMessage('Please allow microphone access.')
        try { await playText('Please allow microphone access and check your browser settings.', 1) } catch { /* ignore */ }
      } else {
        setErrorMessage('An error occurred with voice input.')
      }
    }
  })

  // Fix 3+4: handleUpload accepts File | null and UploadArea is now inside EndMessageOverlay area
  const handleUpload = async (file: File | null) => {
    // Fix 4: null guard — UploadArea fires null when user clears the image
    if (!file) return

    setErrorMessage(null)
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Image = reader.result as string
      const base64Content = base64Image.split(',')[1] || base64Image
      try {
        const visionResponse = await mistralClient.vision({
          image: `data:${file.type};base64,${base64Content}`,
          messages: history
        })
        resumeSessionWithVision({ feedback: visionResponse.feedback })
        await playText(visionResponse.feedback, 1)
      } catch (error) {
        console.error('Vision API error:', error)
        
        // Check if fallback mode is enabled
        const useFallback = isFeatureEnabled('ENABLE_VISION_FALLBACK')
        
        if (!useFallback) {
          // Default behavior: Show honest error message and prompt retry
          const honestErrorAudio = getHonestErrorMessage(history)
          const honestErrorUI = getHonestErrorUIMessage(history)
          
          // Set UI error message
          setErrorMessage(honestErrorUI)
          
          // Play audio feedback with honest error message
          try {
            await playText(honestErrorAudio, 1)
          } catch (audioError) {
            console.error('Failed to play error message:', audioError)
          }
          
          // Track honest error metric
          console.log('[Metrics] vision_failure_honest')
        }
        // If fallback is enabled, the backend already returned a fallback response
        // and the resumeSessionWithVision was already called with the fallback feedback
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleMicToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="app-container max-w-2xl mx-auto p-4 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold mb-4">Ink Echo</h1>

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="w-full bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div
          aria-live="polite"
          className="w-full text-center text-sm text-gray-500 animate-pulse"
        >
          Thinking…
        </div>
      )}

      <div className="w-full">
        <ConversationLog messages={history} />
      </div>

      <div className="w-full flex justify-center mt-6">
        <MicButton
          isRecording={isRecording}
          disabled={isSessionEnded || isProcessing}
          onClick={handleMicToggle}
        />
      </div>

      {/* Session ended overlay */}
      <EndMessageOverlay
        isVisible={isSessionEnded}
        message={`Your ${getMaxTurns()} turns are complete. Please upload a photo of your handwritten reflection.`}
        onRestart={startUploadMode}
      />

      {/* Upload area shown when waiting for vision */}
      {isWaitingVision && (
        <div className="w-full">
          {isUploading ? (
            <div aria-live="polite" className="text-center text-sm text-gray-500 animate-pulse py-4">
              Analyzing image…
            </div>
          ) : (
            <UploadArea onImageSelect={handleUpload} />
          )}
        </div>
      )}
    </div>
  )
}

export default App
