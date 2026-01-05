import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, handleApiError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const log = logger.child("api:notifications:unread-count")

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return successResponse({ count: 0 })
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      log.error("Error fetching unread notifications", error, { userId: user.id })
      return successResponse({ count: 0 }) // Return 0 on error to prevent UI breaking
    }

    return successResponse({ count: count || 0 })
  } catch (error) {
    return handleApiError(error, "notifications:unread-count:GET")
  }
}
