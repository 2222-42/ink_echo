# Issue #21: Audio Resource Cleanup on Component Unmount

## Problem Analysis

### Current Behavior
1. When `playAudio()` is called, it creates an Audio object and plays it
2. It sets a timeout to revoke the object URL after 1 second
3. However, the Audio object itself is not cleaned up
4. If the component unmounts while audio is playing, the Audio object remains in memory
5. Multiple audio playbacks can accumulate, causing memory leaks

### Expected Behavior
1. Audio resources should be properly cleaned up when no longer needed
2. If component unmounts, any playing audio should be stopped
3. Object URLs should be revoked immediately when audio is no longer needed
4. No memory leaks from accumulated Audio objects

## Acceptance Criteria

### AC-1: Audio cleanup on component unmount
- When a component using `useAudio` unmounts, any playing audio should be stopped
- All Audio objects should be cleaned up
- Object URLs should be revoked

### AC-2: Proper cleanup when stopping playback
- When `playAudio` completes, all resources should be cleaned up
- No lingering Audio objects or object URLs

### AC-3: No memory leaks from multiple playbacks
- Multiple calls to `playAudio` should not accumulate Audio objects
- Each playback should clean up after itself

### AC-4: Error handling during cleanup
- If cleanup fails, errors should be handled gracefully
- No crashes or exceptions during cleanup

## Implementation Plan

### 1. Track active audio playback
- Add a ref to track the currently playing Audio object
- Store the object URL for cleanup

### 2. Implement cleanup function
- Stop the audio playback
- Revoke the object URL
- Clean up the Audio object reference

### 3. Add cleanup on unmount
- In `useAudio` hook, clean up audio resources when unmounting
- Stop any playing audio
- Revoke object URLs

### 4. Update tests
- Add tests for cleanup behavior
- Verify no memory leaks
- Test unmount scenarios

## Files to Modify

1. `src/api/elevenlabsClient.ts` - Add cleanup functionality
2. `src/hooks/useAudio.ts` - Add audio cleanup on unmount
3. `src/api/elevenlabsClient.test.ts` - Add cleanup tests
4. `src/hooks/useAudio.test.ts` - Add unmount cleanup tests

## Verification Steps

```bash
# Run all tests
npm test

# Check for memory leaks (manual testing)
# 1. Start multiple audio playbacks
# 2. Unmount component
# 3. Verify no audio continues playing
# 4. Verify no memory leaks in browser dev tools
```
