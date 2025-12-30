import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: landlordId } = await params

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    })

    const { data: landlord, error: landlordError } = await supabase
      .from("owners")
      .select("id, name, email, phone, commission_percentage")
      .eq("id", landlordId)
      .single()

    if (landlordError || !landlord) {
      return NextResponse.json({ error: "Landlord not found" }, { status: 404 })
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("landlord_payments")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("payment_date", { ascending: false })

    if (paymentsError) {
      console.error("[v0] Error fetching payments:", paymentsError)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const averagePayment = payments && payments.length > 0 ? totalPaid / payments.length : 0
    const lastPaymentDate = payments && payments.length > 0 ? payments[0].payment_date : null

    const paymentMethodBreakdown: Record<string, number> = {}
    payments?.forEach((payment) => {
      const method = payment.payment_method || "unknown"
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + 1
    })

    const commissionPercentage = landlord.commission_percentage || 10

    // Get all properties for this landlord to calculate total collected
    const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", landlordId)

    let totalCollected = 0
    let totalCommissionDeducted = 0
    let netPayoutCalculated = 0
    let expectedRentTotal = 0

    if (properties && properties.length > 0) {
      const propertyIds = properties.map((p) => p.id)

      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, monthly_rent")
        .in("property_id", propertyIds)
        .eq("status", "active")

      if (tenants && tenants.length > 0) {
        const tenantIds = tenants.map((t) => t.id)

        expectedRentTotal = tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)

        const { data: tenantPayments } = await supabase
          .from("tenant_payments")
          .select("amount")
          .in("tenant_id", tenantIds)

        totalCollected = tenantPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        totalCommissionDeducted = (expectedRentTotal * commissionPercentage) / 100
        netPayoutCalculated = expectedRentTotal - totalCommissionDeducted
      }
    }

    return NextResponse.json({
      landlord,
      payments: payments || [],
      totalPaid,
      averagePayment,
      lastPaymentDate,
      paymentMethodBreakdown,
      totalCollected,
      expectedRentTotal,
      totalCommissionDeducted,
      netPayoutCalculated,
    })
  } catch (error) {
    console.error("[v0] Error in payment history API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
