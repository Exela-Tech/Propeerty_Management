import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: landlordId } = await params
  console.log(" Landlord payments API called for:", landlordId)

  try {
    // Get landlord details
    const { data: landlord, error: landlordError } = await supabase
      .from("owners")
      .select("id, name, email, phone")
      .eq("id", landlordId)
      .single()

    console.log(" Landlord query result:", landlord, landlordError)

    if (landlordError || !landlord) {
      console.log(" Landlord not found:", landlordError)
      return NextResponse.json({ error: "Landlord not found" }, { status: 404 })
    }

    // Get all payments made to this landlord
    const { data: payments, error: paymentsError } = await supabase
      .from("landlord_payments")
      .select(`
        id,
        amount,
        gross_amount,
        management_fee,
        commission_type,
        commission_value,
        payment_date,
        payment_method,
        period_start,
        period_end,
        receipt_number,
        status,
        notes,
        property_id,
        properties (
          name
        )
      `)
      .eq("landlord_id", landlordId)
      .order("payment_date", { ascending: false })

    if (paymentsError) {
      console.error(" Error fetching payments:", paymentsError)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    // Get landlord's properties (check both owner_id and landlord_id)
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("id, commission_type, commission_value")
      .or(`owner_id.eq.${landlordId},landlord_id.eq.${landlordId}`)

    console.log(" Properties query result:", properties, propertiesError)

    const propertyIds = properties?.map((p) => p.id) || []

    // Calculate expected rent from active tenants
    let expectedRentTotal = 0
    let totalCollected = 0

    if (propertyIds.length > 0) {
      // Get units for these properties
      const { data: units } = await supabase
        .from("units")
        .select("id")
        .in("property_id", propertyIds)

      const unitIds = units?.map((u) => u.id) || []
      console.log(" Units found:", unitIds.length)

      if (unitIds.length > 0) {
        const { data: tenants, error: tenantsError } = await supabase
          .from("tenants")
          .select("id, monthly_rent")
          .in("unit_id", unitIds)
          .eq("status", "active")

        console.log(" Tenants query result:", tenants, tenantsError)

        expectedRentTotal = tenants?.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) || 0

        // Get tenant payments for current period
        const today = new Date()
        const currentMonth = today.toISOString().substring(0, 7)
        const [year, month] = currentMonth.split("-")
        const periodStart = `${year}-${month}-01`
        const periodEnd = `${year}-${month}-${new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()}`

        if (tenants && tenants.length > 0) {
          const tenantIds = tenants.map((t) => t.id)
          const { data: tenantPayments } = await supabase
            .from("tenant_payments")
            .select("amount")
            .in("tenant_id", tenantIds)
            .gte("payment_date", periodStart)
            .lte("payment_date", periodEnd)

          totalCollected = tenantPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        }
      }
    }

    // Calculate totals
    const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const averagePayment = payments && payments.length > 0 ? totalPaid / payments.length : 0
    const lastPaymentDate = payments && payments.length > 0 ? payments[0].payment_date : null

    // Calculate commission - use property-level commission if available
    let totalCommissionDeducted = 0
    if (properties && properties.length > 0) {
      // For simplicity, use the first property's commission or average
      const firstProperty = properties[0]
      if (firstProperty.commission_type === "fixed") {
        totalCommissionDeducted = firstProperty.commission_value || 0
      } else {
        totalCommissionDeducted = (expectedRentTotal * (firstProperty.commission_value || 10)) / 100
      }
    } else {
      // Fallback to default 10%
      totalCommissionDeducted = (expectedRentTotal * 10) / 100
    }

    const netPayoutCalculated = expectedRentTotal - totalCommissionDeducted

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {}
    payments?.forEach((p) => {
      const method = p.payment_method || "unknown"
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + (p.amount || 0)
    })

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
    console.error(" Error in landlord payments API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
