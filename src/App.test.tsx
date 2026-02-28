import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { useConversation } from './hooks/useConversation'
import { useAudio } from './hooks/useAudio'
import { mistralClient } from './api/mistralClient'

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock hooks and clients
vi.mock('./hooks/useConversation')
vi.mock('./hooks/useAudio')
vi.mock('./api/mistralClient')
vi.mock('./api/elevenlabsClient')

describe('App Integration', () => {
    let mockUseConversation: any
    let mockUseAudio: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockUseConversation = {
            id: 'test-session',
            turns: 0,
            history: [],
            isSessionEnded: false,
            isWaitingVision: false,
            addMessage: vi.fn(),
            resumeSessionWithVision: vi.fn(),
        }
        vi.mocked(useConversation).mockReturnValue(mockUseConversation)

        mockUseAudio = {
            isRecording: false,
            isListening: false,
            transcript: '',
            startRecording: vi.fn(),
            stopRecording: vi.fn().mockReturnValue('test transcript'),
            playText: vi.fn(),
            isSpeechRecognitionSupported: vi.fn().mockReturnValue(true),
            getTranscript: vi.fn(),
        }
        vi.mocked(useAudio).mockReturnValue(mockUseAudio)

        vi.mocked(mistralClient.chat).mockResolvedValue({
            content: 'Hello from Mistral'
        })
    })

    describe('Normal Turn Flow', () => {
        it('renders MicButton and ConversationLog initially', () => {
            render(<App />)
            expect(screen.getByRole('button', { name: /Start recording/i })).toBeInTheDocument()
        })

        it('handles recording and AI response flow', async () => {
            render(<App />)

            // 1. User clicks MicButton to start recording
            const micButton = screen.getByRole('button', { name: /Start recording/i })
            fireEvent.click(micButton)
            expect(mockUseAudio.startRecording).toHaveBeenCalled()

            // Change mock state to reflect recording
            mockUseAudio.isRecording = true
            mockUseAudio.isListening = true

            const useAudioOptions = vi.mocked(useAudio).mock.calls[0][0]

            // 2. STT finishes and calls onTranscript
            if (useAudioOptions?.onTranscript) {
                useAudioOptions.onTranscript('Hello, this is user.')
            }

            // 3. Verify that user message was added
            await waitFor(() => {
                expect(mockUseConversation.addMessage).toHaveBeenCalledWith('user', 'Hello, this is user.')
            })

            // 4. Verify that mistral API was called
            await waitFor(() => {
                expect(mistralClient.chat).toHaveBeenCalledWith(expect.objectContaining({
                    messages: expect.arrayContaining([{ role: 'user', content: 'Hello, this is user.' }])
                }))
            })

            // 5. Verify that assistant message is added
            await waitFor(() => {
                expect(mockUseConversation.addMessage).toHaveBeenCalledWith('assistant', 'Hello from Mistral')
            })

            // 6. Verify TTS is played
            await waitFor(() => {
                expect(mockUseAudio.playText).toHaveBeenCalledWith('Hello from Mistral', expect.any(Number))
            })
        })
    })

    describe('End Turn Flow', () => {
        it('shows EndMessageOverlay and UploadArea on 7th turn', () => {
            mockUseConversation.turns = 7
            mockUseConversation.isSessionEnded = true

            render(<App />)

            // Should show end message
            expect(screen.getByText(/Your 7 turns are complete/)).toBeInTheDocument()
            // MicButton should be disabled
            const micButton = screen.getByRole('button', { name: /Start recording/i })
            expect(micButton).toBeDisabled()
        })
    })

    describe('Upload & Resume Flow', () => {
        it('handles image upload and vision api fallback', async () => {
            mockUseConversation.turns = 7
            mockUseConversation.isSessionEnded = true
            vi.mocked(mistralClient.vision).mockResolvedValue({
                text: 'some test text',
                themes: [],
                keywords: [],
                main_idea: '',
                connections: [],
                feedback: 'Great reflection!'
            })

            render(<App />)

            const fileInput = screen.getByTestId('upload-input')

            // create mock file
            const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
            fireEvent.change(fileInput, { target: { files: [file] } })

            // It should call mistralClient.vision
            await waitFor(() => {
                expect(mistralClient.vision).toHaveBeenCalled()
            })

            // It should call resumeSessionWithVision
            await waitFor(() => {
                expect(mockUseConversation.resumeSessionWithVision).toHaveBeenCalledWith({
                    feedback: 'Great reflection!'
                })
            })

            // It should play the audio
            await waitFor(() => {
                expect(mockUseAudio.playText).toHaveBeenCalledWith('Great reflection!', 1)
            })
        })
    })
    describe('Error Speech Feedback', () => {
        it('plays mic permission message when STT is not-allowed', async () => {
            render(<App />)

            // Get the onError callback that App passed to useAudio
            const useAudioOptions = vi.mocked(useAudio).mock.calls[0][0]

            // Simulate STT error (not-allowed)
            if (useAudioOptions?.onError) {
                useAudioOptions.onError(new Error('not-allowed'))
            }

            await waitFor(() => {
                expect(mockUseAudio.playText).toHaveBeenCalledWith(
                    expect.stringContaining('Please allow microphone access'),
                    1
                )
            })
        })

        it('plays retry message when Mistral API fails', async () => {
            vi.mocked(mistralClient.chat).mockRejectedValue(new Error('Server error'))

            render(<App />)

            const useAudioOptions = vi.mocked(useAudio).mock.calls[0][0]
            if (useAudioOptions?.onTranscript) {
                useAudioOptions.onTranscript('Hi there')
            }

            await waitFor(() => {
                expect(mockUseAudio.playText).toHaveBeenCalledWith(
                    expect.stringContaining('Please try talking to me again'),
                    1
                )
            })
        })
    })
})
