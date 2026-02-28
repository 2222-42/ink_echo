import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getFeatureFlags, isFeatureEnabled } from './featureFlags'

describe('Feature Flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env for each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  it('should return default flags when no env variables are set', () => {
    const flags = getFeatureFlags()
    
    expect(flags.ENABLE_VISION_FALLBACK).toBe(false)
  })

  it('should read ENABLE_VISION_FALLBACK from environment', () => {
    process.env.ENABLE_VISION_FALLBACK = 'true'
    
    const flags = getFeatureFlags()
    expect(flags.ENABLE_VISION_FALLBACK).toBe(true)
  })

  it('should read ENABLE_VISION_FALLBACK with VITE_ prefix', () => {
    process.env.VITE_ENABLE_VISION_FALLBACK = 'true'
    
    const flags = getFeatureFlags()
    expect(flags.ENABLE_VISION_FALLBACK).toBe(true)
  })

  it('should handle string "1" as true', () => {
    process.env.ENABLE_VISION_FALLBACK = '1'
    
    const flags = getFeatureFlags()
    expect(flags.ENABLE_VISION_FALLBACK).toBe(true)
  })

  it('should handle string "false" as false', () => {
    process.env.ENABLE_VISION_FALLBACK = 'false'
    
    const flags = getFeatureFlags()
    expect(flags.ENABLE_VISION_FALLBACK).toBe(false)
  })

  it('should check individual feature flag', () => {
    process.env.ENABLE_VISION_FALLBACK = 'true'
    
    expect(isFeatureEnabled('ENABLE_VISION_FALLBACK')).toBe(true)
  })

  it('should return false for disabled flag', () => {
    expect(isFeatureEnabled('ENABLE_VISION_FALLBACK')).toBe(false)
  })
})
