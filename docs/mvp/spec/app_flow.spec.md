# App Flow Specification

This document defines the acceptance criteria for high-level App component flow and application configuration logic.

## ACCEPTANCE_CRITERIA

### featureFlags.ts
- `getConfigValue` and `getFeatureFlag` MUST access `import.meta.env` using static property references (e.g., `import.meta.env.VITE_MAX_TURNS`) because Vite's string replacement does not support dynamic keys.

### App.tsx
- When the conversation reaches the turn limit (i.e., `isSessionEnded` becomes true) or when the user enters the upload phase (`isWaitingVision` becomes true), the application MUST automatically stop recording voice input.
- The `stopRecording` function must be called to ensure the microphone stream is properly closed and the browser's recording indicator turns off.
