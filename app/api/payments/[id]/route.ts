import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, notFoundResponse, handleApiError } from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"
import { logger } from "@/lib/logger"

const log = logger.child("api:payments")

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!validateUUID(id)) {
      return notFoundResponse("Payment")
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const { data, error } = await supabase.from("tenant_payments").select("*").eq("id", id).single()

    if (error) {
      log.error("Error fetching payment", error, { paymentId: id })
      if (error.code === "PGRST116") {
        // Not found error from Supabase
        return notFoundResponse("Payment")
      }
      return handleApiError(error, "payments:GET")
    }

    if (!data) {
      return notFoundResponse("Payment")
    }

    return successResponse(data)
  } catch (error) {
    return handleApiError(error, "payments:GET")
  }
}