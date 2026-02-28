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
   - Inside or alongside the `EndMessageOverlay`, the `UploadArea` component is visible, allowing the user to select or drag-and-drop an image file.
   - The conversation log remains visible in the background for reference.
