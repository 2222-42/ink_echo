import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateFallbackText,
  getHonestErrorMessage,
  getHonestErrorUIMessage,
  HONEST_ERROR_MESSAGE_JA,
  HONEST_ERROR_MESSAGE_EN,
  HONEST_ERROR_UI_JA,
  HONEST_ERROR_UI_EN
} from '../../../api/mistral/fallback.js'

describe('Fallback Text Generator', () => {
  beforeEach(() => {
    // Mock Math.random for consistent testing
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  it('should generate fallback text for Japanese conversation', () => {
    const history = [
      { role: 'user' as const, content: 'こんにちは' },
      { role: 'assistant' as const, content: 'どうしましたか？' },
    ]

    const fallbackText = generateFallbackText(history)

    // Should be a non-empty string
    expect(fallbackText).toBeTruthy()
    expect(typeof fallbackText).toBe('string')

    // Should contain Japanese characters
    expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(fallbackText)).toBe(true)
  })

  it('should generate fallback text for English conversation', () => {
    const history = [
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'How are you?' },
    ]

    const fallbackText = generateFallbackText(history)

    // Should be a non-empty string
    expect(fallbackText).toBeTruthy()
    expect(typeof fallbackText).toBe('string')

    // Should be in English (no Japanese characters)
    expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(fallbackText)).toBe(false)
  })

  it('should generate fallback text for empty history', () => {
    const history: Array<{ role: 'user' | 'assistant', content: string }> = []

    const fallbackText = generateFallbackText(history)

    // Should default to English for empty history
    expect(fallbackText).toBeTruthy()
    expect(typeof fallbackText).toBe('string')
  })

  it('should handle base64 image parameter', () => {
    const history = [
      { role: 'user' as const, content: 'Test' },
    ]
    const base64Image = 'data:image/png;base64,iVBORw0KGgo='

    const fallbackText = generateFallbackText(history, base64Image)

    expect(fallbackText).toBeTruthy()
  })

  it('should get honest error message in Japanese', () => {
    const history = [
      { role: 'user' as const, content: 'こんにちは' },
    ]

    const errorMessage = getHonestErrorMessage(history)

    expect(errorMessage).toBe(HONEST_ERROR_MESSAGE_JA)
    expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(errorMessage)).toBe(true)
  })

  it('should get honest error message in English', () => {
    const history = [
      { role: 'user' as const, content: 'Hello' },
    ]

    const errorMessage = getHonestErrorMessage(history)

    expect(errorMessage).toBe(HONEST_ERROR_MESSAGE_EN)
  })

  it('should get UI error message in Japanese', () => {
    const history = [
      { role: 'user' as const, content: 'こんにちは' },
    ]

    const errorMessage = getHonestErrorUIMessage(history)

    expect(errorMessage).toBe(HONEST_ERROR_UI_JA)
    expect(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(errorMessage)).toBe(true)
  })

  it('should get UI error message in English', () => {
    const history = [
      { role: 'user' as const, content: 'Hello' },
    ]

    const errorMessage = getHonestErrorUIMessage(history)

    expect(errorMessage).toBe(HONEST_ERROR_UI_EN)
  })

  it('should not make deep interpretations in fallback text', () => {
    const history = [
      { role: 'user' as const, content: 'I feel anxious about the future' },
    ]

    const fallbackText = generateFallbackText(history)

    // Should NOT contain interpretive words like "anxiety", "determination", etc.
    // The fallback should only ask questions, not interpret
    expect(fallbackText.toLowerCase()).not.toMatch(/anxiety|determination|interpreted|analyzed/)
  })

  it('should maintain user agency in fallback text', () => {
    const history = [
      { role: 'user' as const, content: 'I want to change' },
    ]

    const fallbackText = generateFallbackText(history)

    // Should contain question marks or invitation to share
    // This indicates delegating action to the user
    expect(fallbackText).toMatch(/\?|share|tell/)
  })
})
