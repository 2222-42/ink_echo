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

export interface AppConfig {
  /**
   * Maximum number of turns in a conversation session
   * Default: 7
   * Can be overridden via VITE_MAX_TURNS environment variable
   */
  MAX_TURNS: number
}

/**
 * Get feature flag value from environment or default
 * Uses Vite's import.meta.env for environment variable access
 */
function getFeatureFlag(flagName: keyof FeatureFlags): boolean {
  // Check import.meta.env (Vite's way of accessing environment variables)
  // Environment variables must be prefixed with VITE_ to be exposed to client-side code
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
 * Default application configuration values
 * These are used when no environment variable is set
 */
const DEFAULT_CONFIG: AppConfig = {
  MAX_TURNS: 7, // Default: 7 turns before session ends
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

/**
 * Get configuration value from environment or default
 */
function getConfigValue(configName: keyof AppConfig): number {
  // Check import.meta.env (Vite's way of accessing environment variables)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envValue = import.meta.env[`VITE_${configName}`]
    if (envValue !== undefined) {
      const parsed = parseInt(envValue, 10)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  // Default values
  return DEFAULT_CONFIG[configName]
}

/**
 * Get application configuration
 */
export function getAppConfig(): AppConfig {
  return {
    MAX_TURNS: getConfigValue('MAX_TURNS'),
  }
}

/**
 * Get the maximum number of turns allowed in a conversation session
 */
export function getMaxTurns(): number {
  return getConfigValue('MAX_TURNS')
}
