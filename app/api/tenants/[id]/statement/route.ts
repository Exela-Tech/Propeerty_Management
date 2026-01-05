import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { successResponse, notFoundResponse, handleApiError } from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"
import { logger } from "@/lib/logger"

const log = logger.child("api:tenants:statement")

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const tenantId = resolvedParams.id

    // Validate UUID format
    if (!validateUUID(tenantId)) {
      return notFoundResponse("Tenant")
    }

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
      log.error("Tenant not found", tenantError, { tenantId })
      return notFoundResponse("Tenant")
    }

    return successResponse({
      tenant,
      payments: payments || [],
      property: tenant.property,
      unit: tenant.unit,
    })
  } catch (error) {
    return handleApiError(error, "tenants:[id]:statement:GET")
  }
}
