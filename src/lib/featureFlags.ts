/**
 * Feature Flag Configuration
 * 
 * Manages feature flags for the application.
 * In production, this could be replaced with a service like Unleash, LaunchDarkly, or Vercel Edge Config.
 */

export interface FeatureFlags {
  /**
   * Enable graceful degradation for vision API failures
   * Default: false (show honest error message and prompt retry)
   * When true: Use fallback empathetic response template
   */
  ENABLE_VISION_FALLBACK: boolean
}

/**
 * Get feature flag value from environment or default
 */
function getFeatureFlag(flagName: keyof FeatureFlags): boolean {
  // Check environment variable (for server-side)
  if (typeof process !== 'undefined' && process.env) {
    const envValue = process.env[`VITE_${flagName}`] || process.env[flagName]
    if (envValue !== undefined) {
      return envValue === 'true' || envValue === '1'
    }
  }

  // Check import.meta.env (for client-side with Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envValue = import.meta.env[`VITE_${flagName}`]
    if (envValue !== undefined) {
      return envValue === 'true' || envValue === '1'
    }
  }

  // Default values
  return DEFAULT_FLAGS[flagName]
}

/**
 * Default feature flag values
 * These are used when no environment variable is set
 */
const DEFAULT_FLAGS: FeatureFlags = {
  ENABLE_VISION_FALLBACK: false, // Default: show honest error, prompt retry
}

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    ENABLE_VISION_FALLBACK: getFeatureFlag('ENABLE_VISION_FALLBACK'),
  }
}

/**
 * Check if a specific feature flag is enabled
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  return getFeatureFlag(flagName)
}
