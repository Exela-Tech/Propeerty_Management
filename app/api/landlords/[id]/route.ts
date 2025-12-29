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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!id || id === "undefined") {
    return Response.json({ success: false, error: "Invalid landlord ID" }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.from("owners").select("*").eq("id", id).single()

    const { data, error } = await supabase.from("owners").select("*").eq("id", id).single()

    if (error) {
      console.log("[v0] Landlord fetch error:", error)
      return Response.json({ success: false, error: error.message }, { status: 400 })
    }

  if (!data) {
    return Response.json({ success: false, error: "Landlord not found" }, { status: 404 })
  }

  return Response.json({ success: true, data })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, error: authError } = await checkAdminAccess()

  if (!isAdmin) {
    return Response.json({ success: false, error: authError }, { status: 403 })
  }

  const { id } = await params

  if (!id || id === "undefined") {
    return Response.json({ success: false, error: "Invalid landlord ID" }, { status: 400 })
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
    }

    const { data, error } = await supabase.from("owners").update(landlordData).eq("id", id).select().single()

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 400 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin, error: authError } = await checkAdminAccess()

  if (!isAdmin) {
    return Response.json({ success: false, error: authError }, { status: 403 })
  }

  const { id } = await params

  if (!id || id === "undefined") {
    return Response.json({ success: false, error: "Invalid landlord ID" }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Check if landlord has associated properties
  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", id).limit(1)

  if (properties && properties.length > 0) {
    return Response.json(
      { success: false, error: "Cannot delete landlord with associated properties" },
      { status: 400 },
    )
  }

  const { error } = await supabase.from("owners").delete().eq("id", id)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }

  return Response.json({ success: true, message: "Landlord deleted successfully" })
}
