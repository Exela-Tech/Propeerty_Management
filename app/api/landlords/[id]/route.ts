import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"
import { successResponse, notFoundResponse, handleApiError } from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"

const log = logger.child("api:landlords")

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!validateUUID(id)) {
      return notFoundResponse("Landlord")
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies: any[]) {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const { data, error } = await supabase.from("owners").select("*").eq("id", id).single()

    if (error) {
      log.error("Landlord fetch error", error, { landlordId: id })
      if (error.code === "PGRST116") {
        // Not found error from Supabase
        return notFoundResponse("Landlord")
      }
      return handleApiError(error, "landlords:[id]:GET")
    }

    if (!data) {
      return notFoundResponse("Landlord")
    }

    return successResponse(data)
  } catch (err) {
    return handleApiError(err, "landlords:[id]:GET")
  }
}
