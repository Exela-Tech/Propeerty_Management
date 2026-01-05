import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, notFoundResponse, handleApiError } from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"
import { logger } from "@/lib/logger"

const log = logger.child("api:landlords:properties")

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Fetch all properties owned by this landlord
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, name")
      .eq("owner_id", id)
      .order("name", { ascending: true })

    if (error) {
      return handleApiError(error, "landlords:[id]:properties:GET")
    }

    return successResponse(properties || [])
  } catch (error) {
    return handleApiError(error, "landlords:[id]:properties:GET")
  }
}
