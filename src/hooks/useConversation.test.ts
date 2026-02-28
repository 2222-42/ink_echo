import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useConversation } from './useConversation'
import { localStorageImpl } from '../lib/storage'

describe('useConversation', () => {
    beforeEach(() => {
        vi.stubGlobal('crypto', {
            randomUUID: () => 'test-uuid-1234'
        } as unknown as Crypto)
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue(null)
        vi.spyOn(localStorageImpl, 'saveSession').mockImplementation(() => { })
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('initializes with default values and generates a UUID on first load', () => {
        const { result } = renderHook(() => useConversation())

        expect(result.current.id).toBe('test-uuid-1234')
        expect(result.current.turns).toBe(0)
        expect(result.current.history).toEqual([])
        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.isWaitingVision).toBe(false)

        expect(localStorageImpl.getSession).toHaveBeenCalledWith('ink-echo-session')
    })

    it('restores state from storage if it exists', () => {
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue({
            id: 'restored-uuid',
            turns: 3,
            history: [{ role: 'user', content: 'hello' }],
            isSessionEnded: false,
            isWaitingVision: true
        })

        const { result } = renderHook(() => useConversation())

        expect(result.current.id).toBe('restored-uuid')
        expect(result.current.turns).toBe(3)
        expect(result.current.history).toEqual([{ role: 'user', content: 'hello' }])
        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.isWaitingVision).toBe(true)
    })

    it('adds a message to history', () => {
        const { result } = renderHook(() => useConversation())

        act(() => {
            result.current.addMessage('user', 'hello world')
        })

        expect(result.current.history).toHaveLength(1)
        expect(result.current.history[0]).toEqual({ role: 'user', content: 'hello world' })
    })

    it('increments turns when an assistant message is added', () => {
        const { result } = renderHook(() => useConversation())

        expect(result.current.turns).toBe(0)

        act(() => {
            result.current.addMessage('user', 'hello')
        })
        expect(result.current.turns).toBe(0)

        act(() => {
            result.current.addMessage('assistant', 'hi there')
        })
        expect(result.current.turns).toBe(1)
    })

    it('sets isSessionEnded to true when turns reach 7 (after assistant message)', () => {
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue({
            id: 'mock-id',
            turns: 6,
            history: [],
            isSessionEnded: false,
            isWaitingVision: false
        })

        const { result } = renderHook(() => useConversation())

        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.turns).toBe(6)

        act(() => {
            result.current.addMessage('user', 'final message')
            result.current.addMessage('assistant', 'final response')
        })

        expect(result.current.turns).toBe(7)
        expect(result.current.isSessionEnded).toBe(true)
    })

    it('resets session state when resumeSessionWithVision is called', () => {
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue({
            id: 'mock-id',
            turns: 7,
            history: [{ role: 'user', content: 'hello' }],
            isSessionEnded: true,
            isWaitingVision: true
        })

        const { result } = renderHook(() => useConversation())

        expect(result.current.isSessionEnded).toBe(true)
        expect(result.current.isWaitingVision).toBe(true)

        act(() => {
            result.current.resumeSessionWithVision({ feedback: 'Great picture!' })
        })

        expect(result.current.turns).toBe(0)
        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.isWaitingVision).toBe(false)
        expect(result.current.history).toHaveLength(2)
        expect(result.current.history[1]).toEqual({ role: 'assistant', content: 'Great picture!' })
    })

    it('transitions to upload mode when startUploadMode is called', () => {
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue({
            id: 'mock-id',
            turns: 7,
            history: [{ role: 'user', content: 'hello' }],
            isSessionEnded: true,
            isWaitingVision: false
        })

        const { result } = renderHook(() => useConversation())

        expect(result.current.isSessionEnded).toBe(true)
        expect(result.current.isWaitingVision).toBe(false)

        act(() => {
            result.current.startUploadMode()
        })

        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.isWaitingVision).toBe(true)
        expect(result.current.turns).toBe(7) // turns should not change
    })

    it('resets the session completely and generates a new UUID when resetSession is called', () => {
        vi.spyOn(localStorageImpl, 'getSession').mockReturnValue({
            id: 'old-uuid',
            turns: 7,
            history: [{ role: 'user', content: 'hello' }],
            isSessionEnded: true,
            isWaitingVision: true
        })

        const { result } = renderHook(() => useConversation())

        expect(result.current.id).toBe('old-uuid')
        expect(result.current.turns).toBe(7)
        expect(result.current.isSessionEnded).toBe(true)

        // Reset the mock to return a new UUID for the reset
        vi.unstubAllGlobals()
        vi.stubGlobal('crypto', {
            randomUUID: () => 'new-uuid-5678'
        } as unknown as Crypto)

        act(() => {
            (result.current as any).resetSession();
        })

        expect(result.current.id).toBe('new-uuid-5678')
        expect(result.current.turns).toBe(0)
        expect(result.current.history).toEqual([])
        expect(result.current.isSessionEnded).toBe(false)
        expect(result.current.isWaitingVision).toBe(false)
    })
})
