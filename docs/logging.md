# Logging System

This application uses a custom logging utility to prevent sensitive data from being exposed in production logs.

## Features

- **Environment-based log levels**: Automatically adjusts based on `NODE_ENV`
- **Sensitive data sanitization**: Automatically redacts emails, UUIDs, tokens, and other sensitive information in production
- **Configurable log levels**: Can be configured via `LOG_LEVEL` environment variable
- **Client and server support**: Works in both browser and Node.js environments

## Usage

### Basic Usage

```typescript
import { logger } from "@/lib/logger"

// Log an error
logger.error("Operation failed", error)

// Log info
logger.info("User logged in")

// Log warning
logger.warn("Deprecated API used")

// Log debug (only in development)
logger.debug("Debug information")
```

### Context-Specific Loggers

```typescript
import { logger } from "@/lib/logger"

const authLogger = logger.child("auth")
authLogger.error("Authentication failed", error)
// Output: [auth] Authentication failed
```

## Log Levels

- **debug**: Detailed information for debugging (development only)
- **info**: General informational messages
- **warn**: Warning messages
- **error**: Error messages (always logged)

## Environment Configuration

### Development
- Default log level: `debug`
- All log levels are shown
- Full error details including stack traces

### Production
- Default log level: `error`
- Only errors and warnings are logged
- Sensitive data is automatically sanitized:
  - Email addresses → `[EMAIL_REDACTED]`
  - UUIDs → `[UUID_REDACTED]`
  - JWT tokens → `[TOKEN_REDACTED]`
  - Sensitive object keys (password, token, secret, etc.) → `[REDACTED]`

### Custom Log Level

Set the `LOG_LEVEL` environment variable:
```bash
LOG_LEVEL=warn npm run dev
```

## Security Features

1. **Automatic Sanitization**: In production, sensitive data is automatically redacted
2. **No Debug Logs in Production**: Debug logs are completely disabled in production
3. **Error Message Sanitization**: Error messages are sanitized to remove sensitive patterns
4. **Object Key Filtering**: Objects with sensitive keys are automatically sanitized

## Migration from console.log

Replace all `console.log`, `console.error`, `console.warn` statements with the logger:

```typescript
// Before
console.error("Error:", error)
console.log("User ID:", userId)

// After
logger.error("Error", error)
logger.debug("User operation", { userId }) // Only in development
```

## Best Practices

1. **Use appropriate log levels**: 
   - `error` for errors that need attention
   - `warn` for warnings
   - `info` for important events
   - `debug` for detailed debugging (development only)

2. **Don't log sensitive data directly**:
   ```typescript
   // Bad
   logger.info("User logged in", { email, password })
   
   // Good
   logger.info("User logged in", { userId })
   ```

3. **Use context for better organization**:
   ```typescript
   const apiLogger = logger.child("api")
   apiLogger.error("Request failed", error)
   ```
