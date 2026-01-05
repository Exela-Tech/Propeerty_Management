import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

const log = logger.child("api:landlords")

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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
      return Response.json({ success: false, error: error.message }, { status: 400 })
    }

    return Response.json({ success: true, data })
  } catch (err) {
    log.error("Landlord API error", err, { landlordId: id })
    return Response.json({ success: false, error: "Failed to fetch landlord" }, { status: 500 })
  }
}
