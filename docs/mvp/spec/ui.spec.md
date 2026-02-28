# UI Components Specification

## ACCEPTANCE_CRITERIA

### MicButton
- Must render a button with a microphone icon.
- When `isRecording` is true, the button should have a visual indicator (e.g., red color or pulsing effect) and a stop icon instead.
- When `disabled` is true, the button must be unclickable and visually disabled.
- The `onClick` callback must fire when clicked and not disabled.

### ConversationLog
- Must receive an array of message history (`role: 'user' | 'assistant'`, `content: string`).
- Must correctly display messages from both 'user' and 'assistant' with distinct styling.
- For 'assistant' messages, it should render a "Play Audio" button which triggers `onPlayAudio` callback when clicked.
- It should auto-scroll to the bottom when new messages arrive.

### UploadArea
- Must render an area indicating "Drag & drop an image or click to upload".
- Must accept image files (`image/*`).
- When a valid image is selected, it should trigger `onImageSelect(file)` and display a preview.
- It should have a "Clear" button to remove the selected image.

### EndMessageOverlay
- Must display a full-screen semi-transparent overlay when `isVisible` is true.
- Must display a specific end message.
- Must provide a primary call-to-action button to restart or continue.
- When `isVisible` is false, it should render nothing.
