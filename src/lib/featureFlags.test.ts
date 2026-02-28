import { describe, it, expect } from 'vitest'
import { getFeatureFlags, isFeatureEnabled, getAppConfig, getMaxTurns } from './featureFlags'

describe('Feature Flags', () => {
  it('should return default flags when no env variables are set', () => {
    const flags = getFeatureFlags()
    
    // Default should be false
    expect(flags.ENABLE_VISION_FALLBACK).toBe(false)
  })

  it('should return false for disabled flag by default', () => {
    // Without environment variables, should default to false
    expect(isFeatureEnabled('ENABLE_VISION_FALLBACK')).toBe(false)
  })

  it('should have correct default values', () => {
    const flags = getFeatureFlags()
    
    // Verify all flags have expected defaults
    expect(typeof flags.ENABLE_VISION_FALLBACK).toBe('boolean')
    expect(flags.ENABLE_VISION_FALLBACK).toBe(false)
  })

  it('should check individual feature flags', () => {
    // Should return boolean value
    const result = isFeatureEnabled('ENABLE_VISION_FALLBACK')
    expect(typeof result).toBe('boolean')
  })
})

describe('App Configuration', () => {
  it('should return default config when no env variables are set', () => {
    const config = getAppConfig()
    
    // Default should be 7
    expect(config.MAX_TURNS).toBe(7)
  })

  it('should return default max turns of 7', () => {
    // Without environment variables, should default to 7
    expect(getMaxTurns()).toBe(7)
  })

  it('should have correct default values', () => {
    const config = getAppConfig()
    
    // Verify all config values have expected defaults
    expect(typeof config.MAX_TURNS).toBe('number')
    expect(config.MAX_TURNS).toBe(7)
    expect(config.MAX_TURNS).toBeGreaterThan(0)
  })

  it('should return a positive number for max turns', () => {
    const maxTurns = getMaxTurns()
    expect(typeof maxTurns).toBe('number')
    expect(maxTurns).toBeGreaterThan(0)
  })
})

// Note: Environment variable testing for import.meta.env requires build-time configuration
// and cannot be easily mocked in unit tests. The feature flag functionality should be
// tested in integration/E2E tests or by setting VITE_ENABLE_VISION_FALLBACK at build time.
