import { useState } from 'react'
import { useConversation } from './hooks/useConversation'
import { useAudio } from './hooks/useAudio'
import { mistralClient } from './api/mistralClient'
import { MicButton } from './components/MicButton'
import { ConversationLog } from './components/ConversationLog'
import { EndMessageOverlay } from './components/EndMessageOverlay'
import { UploadArea } from './components/UploadArea'
import './App.css'

function App() {
  const {
    turns,
    history,
    isSessionEnded,
    addMessage,
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
        setErrorMessage('応答の取得に失敗しました。もう一度話しかけてください。')
      } finally {
        setIsProcessing(false)
      }
    },
    onError: (error) => {
      console.error('Audio error:', error)
      setErrorMessage('音声入力でエラーが発生しました。')
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
        setErrorMessage('画像の解析に失敗しました。もう一度アップロードしてください。')
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
          考え中…
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

      {/* Fix 3: EndMessageOverlay is always a non-blocking banner, UploadArea is always rendered below it */}
      {isSessionEnded && (
        <div className="w-full flex flex-col gap-4">
          <EndMessageOverlay
            isVisible={true}
            message="7ターンが終了しました。手書きの振り返りをアップロードしてください"
            onRestart={() => { }}
          />
          <div className="w-full">
            {isUploading ? (
              <div aria-live="polite" className="text-center text-sm text-gray-500 animate-pulse py-4">
                画像を解析中…
              </div>
            ) : (
              <UploadArea onImageSelect={handleUpload} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
