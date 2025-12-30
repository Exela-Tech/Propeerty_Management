import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const tenantId = resolvedParams.id

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

    const [tenantResult, paymentsResult] = await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id, first_name, last_name, email, phone, currency, balance, monthly_rent, prepaid_balance, property_id, unit_id, property:property_id(id, name), unit:unit_id(id, unit_number, status, bedrooms, bathrooms, monthly_rent)",
        )
        .eq("id", tenantId)
        .single(),

      supabase
        .from("tenant_payments")
        .select("id, amount, payment_date, payment_period")
        .eq("tenant_id", tenantId)
        .order("payment_date", { ascending: false })
        .limit(100), // Limit payment history
    ])

    const { data: tenant, error: tenantError } = tenantResult
    const { data: payments } = paymentsResult

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    return NextResponse.json({
      tenant,
      payments: payments || [],
      property: tenant.property,
      unit: tenant.unit,
    })
  } catch (error) {
    console.error("Error fetching tenant statement:", error)
    return NextResponse.json({ error: "Failed to fetch statement" }, { status: 500 })
  }
}
