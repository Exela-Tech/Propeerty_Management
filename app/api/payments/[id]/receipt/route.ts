import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getServiceClient(cookieStore: any) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    const cookieStore = await cookies()
    const supabase = getServiceClient(cookieStore)

    const [paymentResult, tenantsPaymentsResult] = await Promise.all([
      supabase
        .from("tenant_payments")
        .select(
          "*, tenant:tenant_id(id, first_name, last_name, email, phone, currency, balance, monthly_rent, prepaid_balance, property_id, unit_id, property:property_id(id, name), unit:unit_id(id, unit_number, status, bedrooms, bathrooms, monthly_rent))",
        )
        .eq("id", id)
        .single(),

      supabase
        .from("tenant_payments")
        .select("id, amount, payment_date, payment_period")
        .limit(100) // Limit historical payments
        .order("payment_date", { ascending: true }),
    ])

    const { data: payment, error: paymentError } = paymentResult
    const { data: allPayments } = tenantsPaymentsResult

    if (paymentError || !payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 })
    }

    const tenant = payment.tenant
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 })
    }

    let balanceAtPayment = tenant?.monthly_rent || 0
    if (allPayments && allPayments.length > 0) {
      const sumOfPayments = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      balanceAtPayment = Math.max(0, (tenant?.monthly_rent || 0) - sumOfPayments)
    }

    const paymentBreakdown = []
    let remainingAmount = payment.amount
    const currentPaymentPeriod = payment.payment_period

    if (currentPaymentPeriod && remainingAmount > 0) {
      const monthlyRent = tenant?.monthly_rent || 0

      // Get outstanding balance before this payment
      const previousPayments = allPayments?.filter((p) => p.payment_date < payment.payment_date) || []
      const sumOfPreviousPayments = previousPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const outstandingForCurrentMonth = Math.max(0, monthlyRent - sumOfPreviousPayments)

      if (outstandingForCurrentMonth > 0 && remainingAmount > 0) {
        const appliedAmount = Math.min(remainingAmount, outstandingForCurrentMonth)
        const isFullPayment =
          appliedAmount >= outstandingForCurrentMonth && remainingAmount <= outstandingForCurrentMonth
        paymentBreakdown.push({
          month: currentPaymentPeriod,
          amount: appliedAmount,
          type: isFullPayment ? "full_payment" : "partial_payment",
        })
        remainingAmount -= appliedAmount
      }

      if (remainingAmount > 0) {
        const nextMonth = new Date(currentPaymentPeriod + "-01")
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        const nextMonthStr = nextMonth.toISOString().substring(0, 7)

        paymentBreakdown.push({
          month: nextMonthStr,
          amount: remainingAmount,
          type: "overpayment_credit",
        })
      }
    }

    return Response.json({
      ...payment,
      tenant: {
        ...tenant,
        balanceAtPayment,
      },
      property: payment.tenant?.property,
      unit: payment.tenant?.unit,
      paymentBreakdown,
    })
  } catch (error) {
    console.error("Error fetching receipt:", error)
    return Response.json({ error: "Failed to fetch receipt" }, { status: 500 })
  }
}
