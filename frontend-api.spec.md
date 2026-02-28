# Frontend API Client Layer - Specification

## ACCEPTANCE_CRITERIA

### Task 4.1: Mistral API Client Wrapper

**Objective**: Create client-side wrappers for Mistral API endpoints.

**Requirements**:
1. Create `src/api/mistralClient.ts` with methods for chat and vision endpoints
2. Implement proper error handling and retry logic
3. Add request/response type definitions
4. Create `mistralClient.test.ts` with comprehensive tests
5. Ensure system prompts are NOT sent from client (handled server-side)

**Test Criteria**:
- [ ] `chat()` method sends messages to `/api/mistral/chat`
- [ ] `vision()` method sends image + messages to `/api/mistral/vision`
- [ ] Error responses are properly handled
- [ ] Response parsing works correctly
- [ ] No system prompts in client-side requests

### Task 4.2: ElevenLabs API Client Wrapper

**Objective**: Create client-side wrapper for ElevenLabs TTS endpoint.

**Requirements**:
1. Create `src/api/elevenlabsClient.ts` with TTS method
2. Implement audio streaming and playback
3. Add proper error handling for audio generation
4. Create `elevenlabsClient.test.ts` with comprehensive tests
5. Support dynamic voice settings based on turn number

**Test Criteria**:
- [ ] `speak()` method sends text to `/api/elevenlabs/tts`
- [ ] Audio streaming works correctly
- [ ] Audio playback is handled
- [ ] Error responses are properly handled
- [ ] Turn-based voice settings are applied

### Task 4.3: useAudio Hook

**Objective**: Create audio management hook for recording and playback.

**Requirements**:
1. Create `src/hooks/useAudio.ts` for audio management
2. Implement Web Speech API for STT recording
3. Integrate with ElevenLabs client for TTS playback
4. Create `useAudio.test.ts` with comprehensive tests
5. Manage recording state (start/stop/listening)

**Test Criteria**:
- [ ] `startRecording()` starts Web Speech API recognition
- [ ] `stopRecording()` stops recognition and returns text
- [ ] `playAudio()` plays audio from ElevenLabs
- [ ] Recording state is properly managed
- [ ] Error handling for browser compatibility

## Implementation Notes

### Security Considerations
- All API calls go through backend proxies
- No API keys in client-side code
- Input validation on both client and server
- Error messages don't expose sensitive information

### Error Handling
- Consistent error format across all clients
- User-friendly error messages
- Retry logic for transient failures
- Graceful degradation when features unavailable

### Browser Compatibility
- Web Speech API support detection
- Fallback for unsupported browsers
- Feature detection before usage

### Performance Considerations
- Audio streaming for efficient playback
- Proper cleanup of audio resources
- Memory management for audio buffers

### Testing Strategy
- Unit tests for individual methods
- Integration tests for complete flows
- Mock external API calls
- Test error scenarios thoroughly
