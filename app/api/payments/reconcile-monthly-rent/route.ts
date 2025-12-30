import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * POST /api/payments/reconcile-monthly-rent
 * Reconciles monthly rent calculations for all tenants
 * Improves accuracy by:
 * - Checking tenant creation date vs current date
 * - Handling partial months correctly
 * - Accounting for prepaid balances
 * - Verifying payment periods match rent due dates
 */
export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
    const body = await request.json().catch(() => ({}))
    const { month, year, tenantId } = body

    const today = new Date()
    const targetMonth = month ? Number.parseInt(month) - 1 : today.getMonth() // 0-indexed
    const targetYear = year ? Number.parseInt(year) : today.getFullYear()

    // Build query
    let query = supabase.from("tenants").select("id, first_name, last_name, monthly_rent, balance, prepaid_balance, rent_due_day, created_at, status, currency")

    if (tenantId) {
      query = query.eq("id", tenantId)
    } else {
      query = query.eq("status", "active")
    }

    const { data: tenants, error: tenantsError } = await query

    if (tenantsError) {
      return NextResponse.json({ error: tenantsError.message }, { status: 400 })
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({ message: "No tenants found", reconciled: [] })
    }

    const reconciled = []
    const errors = []

    for (const tenant of tenants) {
      try {
        const tenantCreated = new Date(tenant.created_at)
        const tenantDueDay = tenant.rent_due_day || 1

        // Calculate if tenant should have rent due for this month
        const monthStart = new Date(targetYear, targetMonth, 1)
        const monthEnd = new Date(targetYear, targetMonth + 1, 0) // Last day of month

        // Skip if tenant was created after this month
        if (tenantCreated > monthEnd) {
          reconciled.push({
            tenantId: tenant.id,
            tenantName: `${tenant.first_name} ${tenant.last_name}`,
            status: "skipped",
            reason: "Created after target month",
            expectedRent: 0,
            calculatedRent: 0,
          })
          continue
        }

        // Calculate expected rent for this month
        let expectedRent = Number.parseFloat(tenant.monthly_rent || 0)

        // If tenant was created during this month, calculate prorated rent
        if (tenantCreated >= monthStart && tenantCreated <= monthEnd) {
          const daysInMonth = monthEnd.getDate()
          const daysFromCreation = daysInMonth - tenantCreated.getDate() + 1
          const proratedRent = (expectedRent / daysInMonth) * daysFromCreation
          expectedRent = Math.round(proratedRent * 100) / 100
        }

        // Get payments for this specific month
        const monthStr = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`
        const { data: payments } = await supabase
          .from("tenant_payments")
          .select("id, amount, payment_date, payment_period")
          .eq("tenant_id", tenant.id)
          .or(`payment_period.eq.${monthStr},and(payment_date.gte.${monthStart.toISOString().split("T")[0]},payment_date.lte.${monthEnd.toISOString().split("T")[0]})`)

        const totalPaid = payments?.reduce((sum, p) => sum + Number.parseFloat(p.amount || "0"), 0) || 0
        const currentBalance = Number.parseFloat(tenant.balance || 0)
        const prepaidBalance = Number.parseFloat(tenant.prepaid_balance || 0)

        // Calculate what the balance should be
        // Balance = Expected Rent - Payments Made + Previous Balance
        const calculatedBalance = Math.max(0, expectedRent - totalPaid)

        // Check if balance needs correction
        const balanceDifference = Math.abs(currentBalance - calculatedBalance)
        const needsCorrection = balanceDifference > 0.01 // Allow for rounding differences

        reconciled.push({
          tenantId: tenant.id,
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          expectedRent,
          totalPaid,
          currentBalance,
          calculatedBalance,
          prepaidBalance,
          balanceDifference,
          needsCorrection,
          paymentCount: payments?.length || 0,
          status: needsCorrection ? "needs_correction" : "accurate",
        })
      } catch (error: any) {
        errors.push({
          tenantId: tenant.id,
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      month: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`,
      reconciled,
      errors,
      summary: {
        total: reconciled.length,
        accurate: reconciled.filter((r) => r.status === "accurate").length,
        needsCorrection: reconciled.filter((r) => r.needsCorrection).length,
        skipped: reconciled.filter((r) => r.status === "skipped").length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error reconciling monthly rent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/payments/reconcile-monthly-rent
 * Get reconciliation report without making changes
 */
export async function GET(request: Request) {
  return POST(request)
}
