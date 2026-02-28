// API Configuration

export const API_CONFIG = {
  // CORS settings
  CORS_HEADERS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  
  // Default timeout settings
  TIMEOUT_MS: 30000, // 30 seconds
  
  // Error codes
  ERROR_CODES: {
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_API_KEY: 'MISSING_API_KEY',
    API_ERROR: 'API_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
}

// Error response format
export interface ApiError {
  error: string
  code: string
}

// Success response format
export interface ApiSuccessResponse<T> {
  data: T
  success: true
}

// Error response format
export interface ApiErrorResponse {
  error: string
  code: string
  success: false
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
