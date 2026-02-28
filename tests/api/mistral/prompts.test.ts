import { describe, it, expect } from 'vitest'
import { getSystemPrompt, CHAT_SYSTEM_PROMPT, VISION_SYSTEM_PROMPT } from '../../../api/mistral/prompts.js'

describe('Mistral API Prompts', () => {
    describe('getSystemPrompt (vision context)', () => {
        it('should return the vision system prompt', () => {
            const prompt = getSystemPrompt('vision')
            expect(prompt).toContain(VISION_SYSTEM_PROMPT.trim())
        })
    })

    describe('getSystemPrompt (chat context)', () => {
        it('should return the base chat system prompt for turn 1-4', () => {
            const promptTurn1 = getSystemPrompt('chat', 1)
            const promptTurn4 = getSystemPrompt('chat', 4)

            expect(promptTurn1).toContain(CHAT_SYSTEM_PROMPT.trim())
            expect(promptTurn4).toContain(CHAT_SYSTEM_PROMPT.trim())

            expect(promptTurn1).not.toContain('突き放す')
            expect(promptTurn1).not.toContain('physical card right now')
        })

        it('should default to turn 1 if turn is not provided', () => {
            // TypeScript might complain before we update the signature, but we can cast or ignore
            // Let's just pass 1 or nothing
            const promptDefault = (getSystemPrompt as any)('chat')
            expect(promptDefault).not.toContain('突き放す')
            expect(promptDefault).not.toContain('physical card right now')
        })

        it('should append a slightly colder instruction for turn 5 and 6', () => {
            const promptTurn5 = getSystemPrompt('chat', 5)
            const promptTurn6 = getSystemPrompt('chat', 6)

            expect(promptTurn5).toContain('突き放す')
            expect(promptTurn6).toContain('突き放す')

            expect(promptTurn5).not.toContain('physical card right now')
        })

        it('should append the behavior-forcing question instruction for turn 7', () => {
            const promptTurn7 = getSystemPrompt('chat', 7)

            expect(promptTurn7).toContain('physical card right now')
            expect(promptTurn7).toContain('behavior-forcing question')
        })

        it('should append the terminal edge case instruction for turn 8+', () => {
            const promptTurn8 = getSystemPrompt('chat', 8)
            const promptTurn10 = getSystemPrompt('chat', 10)

            expect(promptTurn8).toContain('The session has ended')
            expect(promptTurn10).toContain('The session has ended')
        })
    })
})
