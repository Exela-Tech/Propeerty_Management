// Result type for error handling
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: AppError }

// Error codes
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
}

// Application error type
export interface AppError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
}

// Success helper
export function success<T>(data: T): Result<T> {
  return { success: true, data }
}

// Failure helper
export function failure<T>(error: AppError): Result<T> {
  return { success: false, error }
}

// Create error helper
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code,
    message,
    details,
  }
}

// Convert unknown error to AppError
export function toAppError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error.message,
      details: { stack: error.stack },
    }
  }

  if (typeof error === "string") {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: error,
    }
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    details: { error },
  }
}

// User roles
export type UserRole = "admin" | "landlord" | "renter" | "tenant"

// Property status
export type PropertyStatus = "pending" | "approved" | "rejected"

// Property type
export interface Property {
  id: string
  landlord_id: string
  title: string
  description: string
  property_type: string
  address: string
  city: string
  state: string
  zip_code: string
  bedrooms: number
  bathrooms: number
  square_feet: number | null
  rent_amount: number
  deposit_amount: number
  status: PropertyStatus
  images: string[] | null
  amenities: string[] | null
  available_from: string | null
  created_at: string
  updated_at: string
}
