import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach((cookie: any) => cookieStore.set(cookie.name, cookie.value, cookie.options))
        } catch {}
      },
    },
  })

  const { data: expenses, error } = await supabase
    .from("transactions")
    .select("id, amount, currency, category, transaction_date, description, property:property_id(id, name)")
    .eq("type", "expense")
    .order("transaction_date", { ascending: false })
    .limit(100) // Paginate results

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(expenses || [])
}
