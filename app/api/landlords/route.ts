import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, unauthorizedResponse, forbiddenResponse, handleApiError, HttpStatus } from "@/lib/api-response"
import {
  parseJsonBody,
  validateRequired,
  validateEmail,
  validatePhone,
  createValidationErrorResponse,
} from "@/lib/api-validation"

async function checkAdminAccess() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // No-op for server-side
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, error: "Forbidden: Admin access required" }
  }

  return { isAdmin: true }
}

export async function GET() {
  try {
    const { isAdmin, error: authError } = await checkAdminAccess()

    if (!isAdmin) {
      if (authError === "Unauthorized") {
        return unauthorizedResponse()
      }
      return forbiddenResponse(authError || "Admin access required")
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data, error } = await supabase.from("owners").select("*").order("name", { ascending: true })

    if (error) {
      return handleApiError(error, "landlords:GET")
    }

    return successResponse(data || [])
  } catch (error) {
    return handleApiError(error, "landlords:GET")
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, error: authError } = await checkAdminAccess()

    if (!isAdmin) {
      if (authError === "Unauthorized") {
        return unauthorizedResponse()
      }
      return forbiddenResponse(authError || "Admin access required")
    }

    // Parse and validate request body
    const parseResult = await parseJsonBody(request)
    if (!parseResult.success) {
      return parseResult.response
    }

    const body = parseResult.data as Record<string, unknown>

    // Validate required fields
    const requiredFields = ["email"]
    const validation = validateRequired(body, requiredFields)
    if (!validation.valid) {
      return createValidationErrorResponse(validation)
    }

    // Validate email format
    if (body.email && typeof body.email === "string" && !validateEmail(body.email)) {
      return createValidationErrorResponse({
        valid: false,
        errors: [{ field: "email", message: "Invalid email format" }],
      })
    }

    // Validate phone if provided
    if (body.phone && typeof body.phone === "string" && !validatePhone(body.phone)) {
      return createValidationErrorResponse({
        valid: false,
        errors: [{ field: "phone", message: "Invalid phone number format" }],
      })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const landlordData = {
      name: body.name || `${body.first_name || ""} ${body.last_name || ""}`.trim() || "Unknown",
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      notes: body.notes || null,
      payment_due_day: body.payment_due_day ? Number.parseInt(String(body.payment_due_day), 10) : 30,
      landlord_id: null,
    }

    // Validate payment_due_day range
    if (landlordData.payment_due_day < 1 || landlordData.payment_due_day > 31) {
      return createValidationErrorResponse({
        valid: false,
        errors: [{ field: "payment_due_day", message: "Payment due day must be between 1 and 31" }],
      })
    }

    const { data, error } = await supabase.from("owners").insert([landlordData]).select().single()

    if (error) {
      return handleApiError(error, "landlords:POST")
    }

    return successResponse(data, "Landlord created successfully", 201)
  } catch (error) {
    return handleApiError(error, "landlords:POST")
  }
}
