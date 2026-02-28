# End Turn Integration Spec

## Overview
This specification covers the integration of the 7th turn end flow. When the conversation reaches 7 turns, the application must restrict further recording and display the end-of-conversation overlay (`EndMessageOverlay`) with an upload UI (`UploadArea`).

## References
- `[SPEC-05]` 7-turn limit

## ACCEPTANCE_CRITERIA
1. **Trigger Condition:**
   - The user completes the 7th turn. `useConversation`'s `isSessionEnded` becomes `true`.

2. **UI Updates:**
   - The `MicButton` becomes disabled and unclickable.
   - The `EndMessageOverlay` appears, covering or appending to the log area.
   - A concluding message ("7ターンが終了しました。手書きの振り返りをアップロードしてください") is visually presented.

3. **Upload UI Access:**
   - The `EndMessageOverlay` displays an "Upload Card" button (formerly "Restart").
   - Clicking the button sets `isWaitingVision` to `true`, hiding the overlay and displaying the `UploadArea`.
   - The user can then select or drag-and-drop an image file.
   - The conversation log remains visible in the background for reference.
