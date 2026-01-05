/**
 * Input validation utilities for API routes
 * Provides common validation functions and schemas
 */

import { validationErrorResponse, badRequestResponse } from "./api-response"

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate required fields in an object
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[],
): ValidationResult {
  const errors: ValidationError[] = []

  for (const field of fields) {
    const value = data[field]
    if (value === undefined || value === null || value === "") {
      errors.push({
        field,
        message: `${field} is required`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate that a value is a positive number
 */
export function validatePositiveNumber(value: unknown): boolean {
  if (typeof value !== "number" && typeof value !== "string") {
    return false
  }
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return !Number.isNaN(num) && num > 0
}

/**
 * Validate that a value is a non-negative number
 */
export function validateNonNegativeNumber(value: unknown): boolean {
  if (typeof value !== "number" && typeof value !== "string") {
    return false
  }
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return !Number.isNaN(num) && num >= 0
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  min?: number,
  max?: number,
): boolean {
  if (min !== undefined && value.length < min) {
    return false
  }
  if (max !== undefined && value.length > max) {
    return false
  }
  return true
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function validateDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }
  const date = new Date(dateString)
  return date instanceof Date && !Number.isNaN(date.getTime())
}

/**
 * Validate month string format (YYYY-MM)
 */
export function validateMonth(monthString: string): boolean {
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(monthString)) {
    return false
  }
  const [year, month] = monthString.split("-").map(Number)
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12
}

/**
 * Validate phone number (basic validation)
 */
export function validatePhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "")
  // Check if it's all digits and has reasonable length
  return /^\d+$/.test(cleaned) && cleaned.length >= 7 && cleaned.length <= 15
}

/**
 * Validate and parse JSON request body
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<{
  success: true
  data: T
} | {
  success: false
  response: Response
}> {
  try {
    const text = await request.text()
    if (!text) {
      return {
        success: false,
        response: badRequestResponse("Request body is required"),
      }
    }

    try {
      const data = JSON.parse(text) as T
      return { success: true, data }
    } catch (parseError) {
      return {
        success: false,
        response: badRequestResponse("Invalid JSON in request body"),
      }
    }
  } catch (error) {
    return {
      success: false,
      response: badRequestResponse("Failed to read request body"),
    }
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  required: string[] = [],
  optional: string[] = [],
): ValidationResult {
  const errors: ValidationError[] = []

  // Check required params
  for (const param of required) {
    if (!searchParams.has(param) || searchParams.get(param) === "") {
      errors.push({
        field: param,
        message: `Query parameter '${param}' is required`,
      })
    }
  }

  // Validate that only allowed params are present (optional check)
  // This is a soft check - we don't fail if extra params are present
  // but we could add strict mode if needed

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Create validation error response from validation result
 */
export function createValidationErrorResponse(result: ValidationResult): Response {
  return validationErrorResponse("Validation failed", {
    errors: result.errors,
  })
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page?: string,
  limit?: string,
): ValidationResult {
  const errors: ValidationError[] = []

  if (page !== undefined) {
    const pageNum = Number.parseInt(page, 10)
    if (Number.isNaN(pageNum) || pageNum < 1) {
      errors.push({
        field: "page",
        message: "Page must be a positive integer",
      })
    }
  }

  if (limit !== undefined) {
    const limitNum = Number.parseInt(limit, 10)
    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        field: "limit",
        message: "Limit must be between 1 and 100",
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

