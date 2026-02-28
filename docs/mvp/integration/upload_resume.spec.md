# Upload & Resume Integration Spec

## Overview
This specification covers the application flow after the 7th turn, when a user uploads an image of their handwritten reflection. The UI will send this to the Mistral Vision API, receive feedback, play the feedback via TTS, and resume the conversation.

## References
- `[SPEC-12]` Handwritten paper upload
- `[SPEC-13]` Mistral Vision API analysis
- `[SPEC-14]` Resuming the conversation

## ACCEPTANCE_CRITERIA
1. **Image Upload:**
   - The user selects an image via `UploadArea` (file picker or drag-and-drop).
   - The application reads the file as a base64 string.

2. **Vision API Request:**
   - The application calls `mistralClient.vision` with the base64 image data.
   - A loading state (e.g., "Analyzing image...") is visible.

3. **Response & Resume:**
   - A successful response is received from Mistral Vision (`{ feedback: "..." }`).
   - The application calls `useConversation.resumeSessionWithVision(result)`, appending the feedback as an assistant message and resetting the turn count to 0.
   - `useAudio.playText` is called to read the feedback aloud.
   - The `EndMessageOverlay` disappears, and the `MicButton` is re-enabled.

4. **Error Handling:**
   - If the API fails, show an error message. The user can retry the upload.
