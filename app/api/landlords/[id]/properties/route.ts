import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    if (error) throw error

    return Response.json(properties || [])
  } catch (error) {
    console.error("[v0] Error fetching properties:", error)
    return Response.json({ error: "Failed to fetch properties" }, { status: 500 })
  }
}
