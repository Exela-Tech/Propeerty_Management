/**
 * API Response utilities for consistent error handling
 * Provides standardized error response format across all API routes
 */

import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const log = logger.child("api:response")

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: unknown
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * HTTP Status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error codes for different error types
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
} as const

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HttpStatus.OK,
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  }

  return NextResponse.json(response, { status })
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  status: number = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  const error: ApiError = {
    message,
  }
  if (code) {
    error.code = code
  }
  if (details) {
    error.details = details
  }
  const response: ApiErrorResponse = {
    success: false,
    error,
  }

  // Log error for monitoring
  if (status >= 500) {
    log.error("API error response", { message, code, status, details })
  } else if (status >= 400) {
    log.warn("API client error", { message, code, status, details })
  }

  return NextResponse.json(response, { status })
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, details)
}

/**
 * Create a not found error response
 */
export function notFoundResponse(resource: string = "Resource"): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} not found`, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND)
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message: string = "Forbidden"): NextResponse<ApiErrorResponse> {
  return errorResponse(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN)
}

/**
 * Create a conflict error response
 */
export function conflictResponse(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return errorResponse(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details)
}

/**
 * Create a bad request error response
 */
export function badRequestResponse(message: string, details?: unknown): NextResponse<ApiErrorResponse> {
  return errorResponse(message, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT, details)
}

/**
 * Handle errors in API routes with proper logging and response
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  const contextMsg = context ? `[${context}] ` : ""

  if (error instanceof Error) {
    // Database errors
    if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
      return conflictResponse(`${contextMsg}Resource already exists`, { originalError: error.message })
    }

    if (error.message.includes("foreign key") || error.message.includes("violates foreign key")) {
      return badRequestResponse(`${contextMsg}Invalid reference`, { originalError: error.message })
    }

    if (error.message.includes("not found") || error.message.includes("does not exist")) {
      return notFoundResponse(`${contextMsg}Resource`)
    }

    // Validation errors
    if (error.name === "ValidationError" || error.message.includes("validation")) {
      return validationErrorResponse(`${contextMsg}${error.message}`)
    }

    // Generic error
    log.error("API error", error, { context })
    return errorResponse(
      `${contextMsg}${error.message || "An error occurred"}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR,
    )
  }

  // Unknown error type
  log.error("Unknown API error", error, { context })
  return errorResponse(
    `${contextMsg}An unexpected error occurred`,
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR,
  )
}

