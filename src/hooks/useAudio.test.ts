import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAudio } from './useAudio'

/**
 * ACCEPTANCE_CRITERIA
 * 
 * 1. Web Speech API should correctly capture final transcripts and only trigger onTranscript for final results.
 * 2. It should trigger onTranscript with the remaining interim transcript when manually stopped via stopRecording().
 * 3. The SpeechRecognition instance should correctly restart when it ends, without picking up a stale state.isRecording closure.
 * 4. It should silently retry on a 'network' error to handle transient connection issues.
 * 5. It should notify onError on non-network errors.
 * 6. It should debounce identical final transcripts to prevent duplicate messages.
 * 7. It should limit 'network' error retries to 3 times to prevent infinite loops.
 */

// Track instances
let mockInstances: any[] = []

// Mock SpeechRecognition
class MockSpeechRecognition {
    continuous = false
    interimResults = false
    lang = ''
    onresult: any = null
    onerror: any = null
    onend: any = null

    start = vi.fn()
    stop = vi.fn()

    constructor() {
        mockInstances.push(this)
    }
}

describe('useAudio', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockInstances = []
        vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
        vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)
    })

    it('triggers onTranscript with final results only', () => {
        const onTranscript = vi.fn()
        const { result } = renderHook(() => useAudio({ onTranscript }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Send an interim result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    [{ transcript: 'hello' }, { isFinal: false }]
                ]
            } as any)
        })

        // Expect onTranscript NOT to be called
        expect(onTranscript).not.toHaveBeenCalled()
        expect(result.current.transcript).toBe('hello')

        // Send a final result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'hello world' }], { isFinal: true })
                ]
            } as any)
        })

        // Expect onTranscript TO BE called
        expect(onTranscript).toHaveBeenCalledWith('hello world')
    })

    it('triggers onTranscript with remaining transcript when manually stopped', () => {
        const onTranscript = vi.fn()
        const { result } = renderHook(() => useAudio({ onTranscript }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Send an interim result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'pending text' }], { isFinal: false })
                ]
            } as any)
        })

        // Manually stop
        act(() => {
            const returned = result.current.stopRecording()
            expect(returned).toBe('pending text')
        })

        // Expect onTranscript to have been called with the pending text
        expect(onTranscript).toHaveBeenCalledWith('pending text')
    })

    it('restarts recognition via onend using fresh state', () => {
        const { result } = renderHook(() => useAudio({ onTranscript: vi.fn() }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        expect(recognition.start).toHaveBeenCalledTimes(1)

        // Trigger onend while allegedly recording
        act(() => {
            recognition.onend()
        })

        // Expect it to have restarted
        expect(recognition.start).toHaveBeenCalledTimes(2)
    })

    it('retries on network error instead of failing immediately', async () => {
        vi.useFakeTimers()
        const onError = vi.fn()
        const { result } = renderHook(() => useAudio({ onError }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        expect(result.current.isRecording).toBe(true)

        // Trigger a network error
        act(() => {
            recognition.onerror({ error: 'network' } as any)
        })

        // Should NOT have called onError prop
        expect(onError).not.toHaveBeenCalled()
        // Should STILL be reporting as recording to the UI
        expect(result.current.isRecording).toBe(true)

        // Fast forward the retry timeout (1000ms)
        act(() => {
            vi.advanceTimersByTime(1100)
        })

        // Should have attempted to start again
        expect(recognition.start).toHaveBeenCalledTimes(2)

        vi.useRealTimers()
    })

    it('calls onError on non-network errors and stops recording', () => {
        const onError = vi.fn()
        const { result } = renderHook(() => useAudio({ onError }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Trigger a not-allowed error
        act(() => {
            recognition.onerror({ error: 'not-allowed' } as any)
        })

        // Should have called onError
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        expect(onError.mock.calls[0][0].message).toBe('not-allowed')

        // Should have stopped recording
        expect(result.current.isRecording).toBe(false)
    })

    it('limits network error retries to 3 times to prevent infinite loops', async () => {
        vi.useFakeTimers()
        const onError = vi.fn()
        const { result } = renderHook(() => useAudio({ onError }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Trigger 3 consecutive network errors
        for (let i = 0; i < 3; i++) {
            act(() => {
                recognition.onerror({ error: 'network' } as any)
                vi.advanceTimersByTime(1100)
            })
        }

        // Should NOT have called onError prop yet
        expect(onError).not.toHaveBeenCalled()
        expect(result.current.isRecording).toBe(true)

        // Trigger the 4th consecutive network error
        act(() => {
            recognition.onerror({ error: 'network' } as any)
            vi.advanceTimersByTime(1100)
        })

        // Now it SHOULD have bailed out
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        expect(onError.mock.calls[0][0].message).toBe('network')
        expect(result.current.isRecording).toBe(false)

        vi.useRealTimers()
    })

    it('debounces identical final transcripts', () => {
        const onTranscript = vi.fn()
        const { result } = renderHook(() => useAudio({ onTranscript }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Send a final result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'duplicate text' }], { isFinal: true })
                ]
            } as any)
        })

        expect(onTranscript).toHaveBeenCalledTimes(1)

        // Stop manually immediately after with the same pending text (simulating the double trigger bug)
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'duplicate text' }], { isFinal: false })
                ]
            } as any)
            result.current.stopRecording()
        })

        // Exhaustive rapid trigger
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'duplicate text' }], { isFinal: true })
                ]
            } as any)
        })

        // Should still only have called onTranscript once
        expect(onTranscript).toHaveBeenCalledTimes(1)
    })
})
