import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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
  const { isAdmin, error: authError } = await checkAdminAccess()

  if (!isAdmin) {
    return Response.json({ success: false, error: authError }, { status: 403 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.from("owners").select("*").order("name", { ascending: true })

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }

  return Response.json({ success: true, data: data || [] })
}

export async function POST(request: Request) {
  const { isAdmin, error: authError } = await checkAdminAccess()

  if (!isAdmin) {
    return Response.json({ success: false, error: authError }, { status: 403 })
  }

  try {
    const body = await request.json()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const landlordData = {
      name: body.name || `${body.first_name || ""} ${body.last_name || ""}`.trim(),
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      notes: body.notes,
      payment_due_day: body.payment_due_day ? Number.parseInt(body.payment_due_day) : 30,
      landlord_id: null,
    }

    const { data, error } = await supabase.from("owners").insert([landlordData]).select().single()

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 400 })
    }

    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return Response.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }
}
