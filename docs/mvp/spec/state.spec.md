# State & Logic Requirements
This document defines the acceptance criteria for Track 2 components.

## ACCEPTANCE_CRITERIA

### Storage (`lib/storage.ts`)
- Must define a `Storage` interface with `saveSession(id: string, state: object): void` and `getSession(id: string): object | null`.
- Must provide a default implementation `localStorageImpl` that implements the `Storage` interface using the browser's `localStorage`.
- `localStorageImpl.saveSession` must store a serialized JSON object under the given ID key.
- `localStorageImpl.getSession` must retrieve and parse the JSON object for the given ID key, or return null if it doesn't exist or parsing fails.

### useConversation Hook
- `useConversation` must expose state variables: `id` (string), `turns` (number), `history` (array), `isSessionEnded` (boolean), `isWaitingVision` (boolean).
- On first load, it should generate a new random UUID using `crypto.randomUUID()`.
- It should initialize `turns` to 0 and `history` to an empty array.
- It must implement `storage.ts` to save and restore from `localStorage`, restoring the previous session if an ID exists.
- It must expose an `addMessage(role: 'user' | 'assistant', content: string)` function.
- Calling `addMessage` adds the logic to `history`.
- If a user and assistant message pair completes a turn (i.e., when an assistant message is added), `turns` should increment by 1.
- If `turns` reaches 7, `isSessionEnded` should be set to true.
- It must expose a `resumeSessionWithVision(visionResult: { feedback: string })` function.
- Calling `resumeSessionWithVision` should add the assistant's feedback message to history, reset `isSessionEnded` to false, reset `turns` to 0, and clear `isWaitingVision`.
