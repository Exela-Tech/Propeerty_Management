import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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
      return Response.json({ count: 0 })
    }

    const { count } = await supabase
      .from("team_messages")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false)

    return Response.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error fetching unread messages:", error)
    return Response.json({ count: 0 })
  }
}
