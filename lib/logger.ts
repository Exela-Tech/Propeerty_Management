/**
 * Logger utility with environment-based log levels
 * Prevents sensitive data from being logged in production
 */

type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Get current log level from environment
 * Defaults to 'error' in production, 'debug' in development
 */
function getLogLevel(): LogLevel {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    // In browser, only log errors in production
    return process.env.NODE_ENV === "production" ? "error" : "debug"
  }
  
  // Server-side: use LOG_LEVEL env var or default based on NODE_ENV
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel
  }
  return process.env.NODE_ENV === "production" ? "error" : "debug"
}

const currentLogLevel = getLogLevel()
const isProduction = 
  typeof window !== "undefined" 
    ? process.env.NODE_ENV === "production"
    : process.env.NODE_ENV === "production"

/**
 * Sanitize error objects to prevent sensitive data leakage
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // In production, only log error type and message (sanitized)
    if (isProduction) {
      // Remove potential sensitive data from error messages
      let message = error.message
      
      // Remove email addresses
      message = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
      
      // Remove UUIDs (user IDs, etc.)
      message = message.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[UUID_REDACTED]")
      
      // Remove tokens (JWT-like strings)
      message = message.replace(/[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/g, "[TOKEN_REDACTED]")
      
      return `${error.name}: ${message}`
    }
    
    // In development, include full error details
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`
  }
  
  if (typeof error === "string") {
    // Sanitize strings in production
    if (isProduction) {
      return error
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[UUID_REDACTED]")
    }
    return error
  }
  
  return String(error)
}

/**
 * Sanitize data objects to prevent sensitive information leakage
 */
function sanitizeData(data: unknown): unknown {
  if (isProduction) {
    if (typeof data === "object" && data !== null) {
      const sanitized: Record<string, unknown> = {}
      const sensitiveKeys = ["password", "token", "secret", "key", "auth", "email", "id", "user_id", "userId"]
      
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
          sanitized[key] = "[REDACTED]"
        } else if (typeof value === "object" && value !== null) {
          sanitized[key] = sanitizeData(value)
        } else {
          sanitized[key] = value
        }
      }
      return sanitized
    }
  }
  return data
}

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel]
}

class Logger {
  private context?: string

  constructor(context?: string) {
    this.context = context
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context)
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!shouldLog(level)) {
      return
    }

    const prefix = this.context ? `[${this.context}]` : ""
    const timestamp = new Date().toISOString()
    const logMessage = `${timestamp} ${prefix} ${message}`

    // In production, only log errors and warnings
    if (isProduction && level === "debug") {
      return
    }

    const sanitizedArgs = args.map((arg) => sanitizeData(arg))

    switch (level) {
      case "debug":
        // eslint-disable-next-line no-console
        console.debug(logMessage, ...sanitizedArgs)
        break
      case "info":
        // eslint-disable-next-line no-console
        console.info(logMessage, ...sanitizedArgs)
        break
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(logMessage, ...sanitizedArgs)
        break
      case "error":
        // eslint-disable-next-line no-console
        console.error(logMessage, ...sanitizedArgs)
        break
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage("debug", message, ...args)
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage("info", message, ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage("warn", message, ...args)
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (error) {
      const sanitizedError = sanitizeError(error)
      this.formatMessage("error", `${message}`, sanitizedError, ...args)
    } else {
      this.formatMessage("error", message, ...args)
    }
  }
}

// Export default logger instance
export const logger = new Logger()

// Export Logger class for creating context-specific loggers
export { Logger }
