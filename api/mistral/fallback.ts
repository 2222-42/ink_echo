/**
 * Fallback text generation for Vision API failures
 * 
 * This module generates empathetic, non-interpretive fallback responses
 * when the Vision API fails to analyze handwritten content.
 * 
 * STRICT RULES (絶対厳守):
 * 1. AI must NOT make deep interpretations or summaries
 * 2. Must NOT take away user agency
 * 3. Must NOT hide the fact that reading failed
 * 4. Maintain positive and empathetic tone
 * 5. Delegate next action to the user
 * 6. Keep length short (natural for ElevenLabs TTS)
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Fallback response templates
 * These templates acknowledge the failure while maintaining a supportive tone
 */
const FALLBACK_TEMPLATES = [
  "このカード、ちょっと読み取りが難しかったみたい。でも君がここまで書いてくれたこと自体がすごく意味があるよ。どんな気持ちで書いたのか、もう少し教えてくれる？",
  "文字が少し読みづらかったみたい。でも、ここまで書いてくれたこと自体が素晴らしいよ。どんなことを書いたのか教えてくれる？",
  "このカード、君の大事な思いが詰まってるね。読み取りがうまくいかなかったけど、もう少し詳しく話してみない？",
  "読めなかった部分もあるけど、ここまで書いてくれたのは素晴らしいよ。どんな内容だったか、話してくれる？",
  "手書きの文字、ちょっと読み取れなかったみたい。でも書いてくれたこと自体に価値があるよ。何を書いたのか聞かせてくれる？",
]

/**
 * English fallback templates (for English-speaking users)
 */
const FALLBACK_TEMPLATES_EN = [
  "I had a bit of trouble reading this card, but the fact that you wrote it down is meaningful in itself. Can you tell me more about what you were feeling when you wrote it?",
  "The handwriting was a bit hard to read, but what matters is that you took the time to write. Can you share what you wrote about?",
  "This card holds your important thoughts. I couldn't read it clearly, but would you like to tell me more about it?",
  "I couldn't read some parts, but it's wonderful that you wrote it down. Can you tell me what it was about?",
  "I had trouble reading the handwriting, but the act of writing has value. What did you want to express?",
]

/**
 * Generate a fallback response when Vision API fails
 * 
 * @param history - Conversation history (not used for interpretation, only for context awareness)
 * @param base64Image - Base64 image data (not analyzed, just for logging/metrics)
 * @returns Fallback text response
 */
export function generateFallbackText(
  history: Message[],
  base64Image?: string
): string {
  // Detect language preference from conversation history
  // Simple heuristic: check if most recent messages contain Japanese characters
  const isJapanese = history.some(msg => 
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(msg.content)
  )

  const templates = isJapanese ? FALLBACK_TEMPLATES : FALLBACK_TEMPLATES_EN
  
  // Select a random template to provide variety
  const randomIndex = Math.floor(Math.random() * templates.length)
  const fallbackText = templates[randomIndex]

  // Log for metrics/monitoring (if needed)
  console.log('[Fallback] Vision API failed, using fallback template:', {
    templateIndex: randomIndex,
    language: isJapanese ? 'ja' : 'en',
    historyLength: history.length,
    hasImage: !!base64Image,
  })

  return fallbackText
}

/**
 * Honest error message when fallback is disabled
 * This is the default behavior - being transparent about the failure
 */
export const HONEST_ERROR_MESSAGE_JA = 
  "ごめん、手書きの文字がうまく読み取れなかったみたい。もう一度丁寧に書いて撮り直してもらえる？ それとも別の角度で試してみる？"

export const HONEST_ERROR_MESSAGE_EN = 
  "Sorry, I couldn't read the handwriting clearly. Could you try writing it again more clearly and take another photo? Or maybe try a different angle?"

/**
 * Get honest error message based on conversation language
 */
export function getHonestErrorMessage(history: Message[]): string {
  const isJapanese = history.some(msg => 
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(msg.content)
  )
  
  return isJapanese ? HONEST_ERROR_MESSAGE_JA : HONEST_ERROR_MESSAGE_EN
}
