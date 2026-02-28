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

  const {
    isRecording,
    startRecording,
    stopRecording,
    playText
  } = useAudio({
    onTranscript: async (transcript) => {
      // Add user message to history
      addMessage('user', transcript)

      try {
        // Call Mistral API
        const response = await mistralClient.chat({
          messages: [...history, { role: 'user', content: transcript }],
          turn: turns + 1
        })

        // Add assistant reply to history
        addMessage('assistant', response.content)

        // Synthesize speech and play
        await playText(response.content, turns + 1)
      } catch (error) {
        console.error('Failed to get chat response:', error)
      }
    },
    onError: (error) => {
      console.error('Audio error:', error)
    }
  })

  // Handle Image Upload for Vision processing
  const handleUpload = async (file: File) => {
    // Read file as base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Image = reader.result as string
      // Just take the base64 payload part
      const base64Content = base64Image.split(',')[1] || base64Image

      try {
        const visionResponse = await mistralClient.vision({
          image: `data:${file.type};base64,${base64Content}`,
          messages: history
        })

        // Resume session
        resumeSessionWithVision({ feedback: visionResponse.feedback })

        // Play the feedback
        await playText(visionResponse.feedback, 1)
      } catch (error) {
        console.error('Vision API error:', error)
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

      <div className="w-full relative">
        <ConversationLog messages={history} />

        {isSessionEnded && (
          <EndMessageOverlay
            isVisible={true}
            message="7ターンが終了しました。手書きの振り返りをアップロードしてください"
            onRestart={() => { }} // Could reset session entirely
          />
        )}
      </div>

      <div className="w-full flex justify-center mt-6">
        <MicButton
          isRecording={isRecording}
          disabled={isSessionEnded}
          onClick={handleMicToggle}
        />
      </div>

      {isSessionEnded && (
        <div className="w-full mt-4">
          <UploadArea onImageSelect={handleUpload} />
        </div>
      )}
    </div>
  )
}

export default App
