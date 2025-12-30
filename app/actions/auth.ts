"use server"

import { z } from "zod"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Result, success, failure, createError, ErrorCode, toAppError } from "@/lib/types"
import {
  authRateLimiter,
  getRateLimitIdentifier,
  getIpAddress,
} from "@/lib/ratelimit"

// Zod schema for sign-up validation
const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name must be less than 100 characters")
      .trim()
      .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .max(20, "Phone number must be less than 20 characters")
      .regex(/^\+?[\d\s()-]+$/, "Invalid phone number format")
      .trim(),
    role: z.enum(["seller", "blocker", "landlord"]),
  })
  .refine(
    (data) => {
      // Additional password strength check
      return data.password.length >= 8
    },
    {
      message: "Password must be at least 8 characters long",
      path: ["password"],
    }
  )

// Zod schema for login validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
})

export async function signUp(
  data: z.infer<typeof signUpSchema> & { redirectUrl?: string }
): Promise<Result<{ userId: string }>> {
  try {
    const supabase = await createClient()

    // Validate input with Zod (excluding redirectUrl from validation)
    const { redirectUrl, ...signUpData } = data
    const validationResult = signUpSchema.safeParse(signUpData)
    if (!validationResult.success) {
      return failure(
        createError(ErrorCode.VALIDATION_ERROR, "Invalid sign-up data", {
          errors: validationResult.error.errors,
        })
      )
    }

    const validatedData = validationResult.data

    // Rate limiting: Use email as identifier to prevent multiple sign-ups with same email
    const headersList = await headers()
    const ipAddress = getIpAddress(headersList)
    // Use email as primary identifier, fallback to IP
    const identifier = validatedData.email || getRateLimitIdentifier(null, ipAddress)

    const { success: rateLimitSuccess, limit, remaining, reset } = await authRateLimiter.limit(identifier)

    if (!rateLimitSuccess) {
      return failure(
        createError(
          ErrorCode.VALIDATION_ERROR,
          "Too many sign-up attempts. Please try again later.",
          {
            limit,
            remaining,
            reset: new Date(reset).toISOString(),
          }
        )
      )
    }

    // Use provided redirect URL or construct from environment
    const emailRedirectTo = redirectUrl || 
      `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback`

    // Create user account
    // Note: Supabase will handle duplicate email checks during sign-up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: validatedData.fullName,
          phone_number: validatedData.phoneNumber,
          role: validatedData.role,
        },
      },
    })

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return failure(createError(ErrorCode.VALIDATION_ERROR, "Email is already registered"))
      }
      return failure(
        createError(ErrorCode.VALIDATION_ERROR, "Failed to create account", {
          error: authError.message,
        })
      )
    }

    if (!authData.user) {
      return failure(createError(ErrorCode.INTERNAL_ERROR, "User creation failed - no user returned"))
    }

    return success({ userId: authData.user.id })
  } catch (error) {
    return failure(toAppError(error))
  }
}

export async function login(
  data: z.infer<typeof loginSchema>
): Promise<Result<{ userId: string }>> {
  try {
    const supabase = await createClient()

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(data)
    if (!validationResult.success) {
      return failure(
        createError(ErrorCode.VALIDATION_ERROR, "Invalid login data", {
          errors: validationResult.error.errors,
        })
      )
    }

    const validatedData = validationResult.data

    // Rate limiting: Use email as identifier to prevent brute force attacks
    const headersList = await headers()
    const ipAddress = getIpAddress(headersList)
    // Use email as primary identifier, fallback to IP
    const identifier = validatedData.email || getRateLimitIdentifier(null, ipAddress)

    const { success: rateLimitSuccess, limit, remaining, reset } = await authRateLimiter.limit(identifier)

    if (!rateLimitSuccess) {
      return failure(
        createError(
          ErrorCode.VALIDATION_ERROR,
          "Too many login attempts. Please try again later.",
          {
            limit,
            remaining,
            reset: new Date(reset).toISOString(),
          }
        )
      )
    }

    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (authError) {
      // Handle specific Supabase errors
      if (authError.message.includes("Email not confirmed")) {
        return failure(
          createError(
            ErrorCode.VALIDATION_ERROR,
            "Please confirm your email address before logging in. Check your inbox for the confirmation link."
          )
        )
      } else if (authError.message.includes("Invalid login credentials")) {
        return failure(
          createError(ErrorCode.VALIDATION_ERROR, "Invalid email or password. Please check your credentials and try again.")
        )
      }
      return failure(
        createError(ErrorCode.VALIDATION_ERROR, "Failed to login", {
          error: authError.message,
        })
      )
    }

    if (!authData.user) {
      return failure(createError(ErrorCode.INTERNAL_ERROR, "Login failed - no user returned"))
    }

    return success({ userId: authData.user.id })
  } catch (error) {
    return failure(toAppError(error))
  }
}
