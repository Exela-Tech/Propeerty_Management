/**
 * Result type for explicit error handling
 * Inspired by Rust's Result and functional programming's Either
 */

/**
 * Common error codes used throughout the application
 */
export const ErrorCode = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Data & Validation
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Database & External Services
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    STRIPE_ERROR: 'STRIPE_ERROR',

    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]

/**
 * Standardized error structure
 */
export interface AppError {
    code: ErrorCodeType
    message: string
    details?: Record<string, unknown>
}

/**
 * Result type representing either success or failure
 */
export type Result<T, E = AppError> =
    | { success: true; data: T }
    | { success: false; error: E }

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T, never> {
    return { success: true, data }
}

/**
 * Create a failed result
 */
export function failure<E = AppError>(error: E): Result<never, E> {
    return { success: false, error }
}

/**
 * Create an AppError with the given parameters
 */
export function createError(
    code: ErrorCodeType,
    message: string,
    details?: Record<string, unknown>
): AppError {
    return { code, message, details }
}

/**
 * Helper to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
    if (isAppError(error)) {
        return error
    }

    if (error instanceof Error) {
        return createError(ErrorCode.INTERNAL_ERROR, error.message, {
            originalError: error.name,
        })
    }

    return createError(
        ErrorCode.UNKNOWN_ERROR,
        'An unknown error occurred',
        { error: String(error) }
    )
}

/**
 * Type guard to check if an object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        typeof (error as AppError).code === 'string' &&
        typeof (error as AppError).message === 'string'
    )
}
