# Prompt Tone Variation Spec

## Overview
This specification covers the integration of turn-based tone variations in the Mistral LLM prompt for chat conversations, addressing Issue #40. As the conversation progresses towards the 7-turn limit, the AI's tone should become colder and more challenging, pushing the user to think for themselves. In the final turn, the AI must explicitly instruct the user to write their thoughts on a physical card.

## References
- `[SPEC-08]` Prompt formatting and tone requirements
- `[SPEC-12]` Final turn limit and physical card instruction
- Issue #40 Requirements

## ACCEPTANCE_CRITERIA

### AC-1: Turn-based Prompt Tone `getSystemPrompt(turn)`
- **Turn 1-4 (Normal):** The AI maintains a calm, empathetic tone.
- **Turn 5-6 (Challenging):** The AI becomes "colder" and more challenging (突き放す), strictly probing the user to take responsibility for their thoughts without relying on the AI.
- **Turn 7 (Final):** The AI is at its coldest. It MUST explicitly tell the user that this is the final turn and instruct them to write their thoughts or realizations on a physical card right now.

### AC-2: `getSystemPrompt` signature update
- `getSystemPrompt(context: 'chat' | 'vision', turn?: number)` must accept an optional `turn` parameter.
- The prompt returned for `context === 'chat'` should dynamically append instructions based on the `turn` parameter to enforce AC-1.

### AC-3: Chat API passes `turn` to prompt generator
- `/api/mistral/chat` must extract the `turn` from the request body and pass it to `getSystemPrompt('chat', turn)`.

### AC-4: Backward compatibility
- If `turn` is omitted or undefined, `getSystemPrompt` must assume Turn 1 (Normal tone).
