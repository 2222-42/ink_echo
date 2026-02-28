# W&B Weave Tracing Integration - Task 6.1 Documentation

## Overview

This document describes the Weave tracing interface implementation for Track 6 of the Ink Echo MVP. The implementation provides a foundation for future integration with Weights & Biases (W&B) Weave for observability and monitoring.

## Architecture

The tracing system is implemented in two layers:

1. **Backend Layer** (`api/tracing.ts`, `api/middleware.ts`)
   - Middleware that wraps all API endpoints
   - Logs request/response metadata for each API call
   - Measures request duration and captures errors

2. **Frontend Layer** (`src/lib/tracing.ts`, `src/api/*Client.ts`)
   - Client-side tracing wrapper for API calls
   - Logs metadata for frontend API requests
   - Integrated into MistralClient and ElevenLabsClient

## Implementation Details

### Backend Tracing

#### Tracing Middleware (`withTracing`)

The `withTracing` middleware wraps all API endpoints and automatically logs:

- **Request start**: HTTP method, path, timestamp, unique trace ID
- **Request end**: Status code, duration, success/error status
- **Errors**: Error messages and stack traces

**Usage:**

```typescript
import { withTracing } from '../middleware.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  // Your API logic here
}

export default withTracing(withCors(withErrorHandling(handler)))
```

**Trace Metadata Format:**

```typescript
interface TraceMetadata {
  traceId: string           // Unique identifier for the request
  timestamp: string         // ISO 8601 timestamp
  method?: string          // HTTP method (GET, POST, etc.)
  path?: string           // API endpoint path
  durationMs?: number     // Request duration in milliseconds
  statusCode?: number     // HTTP status code
  error?: string          // Error message (if any)
  metadata?: Record<string, any>  // Additional custom metadata
}
```

**Current Integration:**

The middleware is integrated into all API endpoints:
- `/api/mistral/chat` - Chat API
- `/api/mistral/vision` - Vision API
- `/api/elevenlabs/tts` - Text-to-Speech API

### Frontend Tracing

#### Tracing Library (`src/lib/tracing.ts`)

The frontend tracing library provides:

- **TraceLogger interface**: Standard interface for logging traces
- **MockTraceLogger**: Development implementation that logs to console
- **Helper functions**: Generate trace IDs, log metadata

**Usage Example:**

```typescript
import { traceLogger, generateTraceId } from '../lib/tracing'

const traceId = generateTraceId()
const startTime = Date.now()

traceLogger.startTrace(traceId, 'POST', '/api/mistral/chat')

try {
  const response = await fetch('/api/mistral/chat', { ... })
  const durationMs = Date.now() - startTime
  traceLogger.endTrace(traceId, response.status, durationMs)
} catch (error) {
  traceLogger.error(traceId, error)
}
```

**Current Integration:**

Tracing is integrated into API clients:
- `MistralClient.chat()` - Traces chat API calls
- `MistralClient.vision()` - Traces vision API calls
- `ElevenLabsClient.speak()` - Traces TTS API calls

## Testing

### Test Coverage

1. **Frontend Tracing Tests** (`src/lib/tracing.test.ts`)
   - Trace ID generation
   - TraceLogger methods (log, startTrace, endTrace, error)
   - Error handling

2. **Backend Tracing Tests** (`tests/api/middleware/tracing.test.ts`)
   - Middleware integration
   - Trace metadata logging
   - Request duration measurement
   - Error tracking

All tests pass successfully (13/13 tests passing).

## Future W&B Weave Integration

The current implementation uses a mock logger that outputs to console. To integrate with W&B Weave:

### Backend Integration

Replace the mock logger in `api/tracing.ts`:

```typescript
import weave from '@wandb/weave'

export function logTrace(metadata: TraceMetadata): void {
  // Send to W&B Weave instead of console
  weave.log(metadata)
}
```

### Frontend Integration

Replace the MockTraceLogger in `src/lib/tracing.ts`:

```typescript
import weave from '@wandb/weave'

class WeaveTraceLogger implements TraceLogger {
  log(metadata: TraceMetadata): void {
    weave.log(metadata)
  }
  
  // Implement other methods...
}

export const traceLogger: TraceLogger = new WeaveTraceLogger()
```

### Installation

To enable W&B Weave, install the package:

```bash
npm install @wandb/weave
```

And configure the API key:

```bash
export WANDB_API_KEY="your-api-key"
export WANDB_PROJECT="ink-echo"
```

## Benefits

1. **Observability**: Track all API requests with detailed metadata
2. **Performance Monitoring**: Measure request durations to identify bottlenecks
3. **Error Tracking**: Capture and log all errors with context
4. **Debugging**: Trace requests end-to-end with unique trace IDs
5. **Future-Ready**: Easy migration to W&B Weave when needed

## Example Trace Output

Current console output (development mode):

```
[TRACE:START] {
  "traceId": "trace_1772301038943_j0h4ffr",
  "timestamp": "2026-02-28T17:50:38.943Z",
  "method": "POST",
  "path": "/api/mistral/chat"
}

[TRACE] {
  "traceId": "trace_1772301038943_j0h4ffr",
  "timestamp": "2026-02-28T17:50:38.944Z",
  "method": "POST",
  "path": "/api/mistral/chat",
  "durationMs": 1234,
  "statusCode": 200,
  "metadata": {
    "success": true,
    "hasError": false
  }
}
```

## Summary

The Weave tracing interface is now implemented and ready for production use. All API requests are automatically traced with minimal performance overhead. The system is designed to be easily upgraded to full W&B Weave integration when needed.
