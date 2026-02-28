import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAudio } from './useAudio'

/**
 * ACCEPTANCE_CRITERIA
 * 
 * 1. Web Speech API should accumulate final transcripts and only trigger onTranscript after 3 seconds of silence.
 * 2. It should NOT trigger onTranscript manually via stopRecording() to prevent duplicate submissions, relying on the API's natural final result.
 * 3. The SpeechRecognition instance should correctly restart when it ends, without picking up a stale state.isRecording closure.
 * 4. It should silently retry on a 'network' error to handle transient connection issues.
 * 5. It should notify onError on non-network errors.
 * 6. It should limit 'network' error retries to 3 times to prevent infinite loops.
 * 7. It should clear any pending transcripts when a recording is manually stopped.
 * 8. It should prevent spaces from infinitely accumulating when concatenating final transcripts.
 * 9. It should clear the silence timeout when `onError` occurs.
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
        vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)
        vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('triggers onTranscript after 3 seconds of silence', () => {
        vi.useFakeTimers()
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

        // Expect onTranscript NOT to be called immediately
        expect(onTranscript).not.toHaveBeenCalled()

        // Wait 2.9 seconds
        act(() => {
            vi.advanceTimersByTime(2900)
        })
        expect(onTranscript).not.toHaveBeenCalled()

        // Wait the remaining 0.1 seconds to trigger 3s timeout
        act(() => {
            vi.advanceTimersByTime(100)
        })

        // Expect onTranscript TO BE called with trimmed text
        expect(onTranscript).toHaveBeenCalledWith('hello world')
    })

    it('accumulates multiple final results before the silence timeout', () => {
        vi.useFakeTimers()
        const onTranscript = vi.fn()
        const { result } = renderHook(() => useAudio({ onTranscript }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Send first final result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: '  first part  ' }], { isFinal: true })
                ]
            } as any)
        })

        // Wait 1.5 seconds
        act(() => {
            vi.advanceTimersByTime(1500)
        })

        // Send second final result (timeout resets)
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: '  second part  ' }], { isFinal: true })
                ]
            } as any)
        })

        // Wait 2.9 seconds (should not be called yet)
        act(() => {
            vi.advanceTimersByTime(2900)
        })
        expect(onTranscript).not.toHaveBeenCalled()

        // Wait the rest of the 3s timeout
        act(() => {
            vi.advanceTimersByTime(100)
        })

        // Expect onTranscript to be called with combined text, WITHOUT accumulated spaces
        expect(onTranscript).toHaveBeenCalledWith('first part second part')
    })

    it('clears silence timeout on error', () => {
        vi.useFakeTimers()
        const onTranscript = vi.fn()
        const onError = vi.fn()
        const { result } = renderHook(() => useAudio({ onTranscript, onError }))

        act(() => {
            result.current.startRecording()
        })

        const recognition = mockInstances[0]

        // Send a final result
        act(() => {
            recognition.onresult({
                resultIndex: 0,
                results: [
                    Object.assign([{ transcript: 'hello' }], { isFinal: true })
                ]
            } as any)
        })

        // Trigger an error
        act(() => {
            recognition.onerror({ error: 'not-allowed' } as any)
        })

        // Wait 3 seconds
        act(() => {
            vi.advanceTimersByTime(3100)
        })

        // Assert onTranscript wasn't called from the ghost timeout
        expect(onTranscript).not.toHaveBeenCalled()
    })

    it('does NOT trigger onTranscript with remaining transcript when manually stopped', () => {
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

        // Expect onTranscript NOT to have been called with the pending text,
        // relying on the API's natural onresult to finalize it
        expect(onTranscript).not.toHaveBeenCalled()
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
        })
        act(() => {
            vi.advanceTimersByTime(1100)
        })

        // Now it SHOULD have bailed out
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
        expect(onError.mock.calls[0][0].message).toBe('network')
        expect(result.current.isRecording).toBe(false)
    })

    it('clears timeout when manually stopped', () => {
        vi.useFakeTimers()
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
                    Object.assign([{ transcript: 'some text' }], { isFinal: true })
                ]
            } as any)
        })

        // Stop manually immediately after
        act(() => {
            result.current.stopRecording()
        })

        // Wait 3.1 seconds
        act(() => {
            vi.advanceTimersByTime(3100)
        })

        // Should NOT have called onTranscript because timer was cleared
        expect(onTranscript).not.toHaveBeenCalled()
    })
})
