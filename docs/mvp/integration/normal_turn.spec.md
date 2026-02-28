# Normal Turn Integration Spec

## Overview
This specification covers the integration of the UI components (`MicButton`, `ConversationLog`) with the logic hooks (`useConversation`, `useAudio`) and API clients (`mistralClient`, `elevenlabsClient`) for a normal turn flow (Turn 1 to 6).

## References
- `[SPEC-01]` Conversation constraints
- `[SPEC-19]`/`[SPEC-20]` Voice tone rules (dependent on turn count)

## ACCEPTANCE_CRITERIA
1. **Initial State:**
   - The user sees the `ConversationLog` with empty or restored history.
   - The user sees a `MicButton`.
   - The turn count is initialized from `useConversation`.

2. **User Interaction (Recording):**
   - User clicks the `MicButton`. The button indicates "recording" state.
   - User speaks ("recording" -> "listening").
   - User clicks again or stops speaking. Recording stops.
   - `useAudio`'s STT result is captured.
   - The user's input string is added to `useConversation`'s history (user role).

3. **Mistral API Request:**
   - The application calls `mistralClient.chat` with the updated message history (excluding system prompt).
   - A loading indicator or state is shown during the API request.

4. **Response & TTS Playback:**
   - The Mistral API response is received and added to `useConversation`'s history (assistant role). The turn count increments.
   - The application automatically calls `useAudio.playText` with the assistant's reply and the *current turn number* to synthesize speech via ElevenLabs.
   - Audio begins playing in the browser.

5. **Error Handling:**
   - If STT fails, an error message is shown (via toast/UI or console).
   - If `mistralClient.chat` fails, the transaction is gracefully robust (e.g., allow retry, do not increment turn).
   - If `elevenlabsClient.speak` fails, the text reply is still shown in the log, but no audio is played, and an error is logged.
