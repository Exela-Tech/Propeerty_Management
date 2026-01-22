import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  successResponse,
  notFoundResponse,
  handleApiError,
} from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"
import { logger } from "@/lib/logger"

const log = logger.child("api:payments:receipt")

/**
 * Create Supabase server client (request-scoped)
 */
async function getServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1️⃣ Validate UUID
    if (!validateUUID(id)) {
      return notFoundResponse("Payment")
    }

    const cookieStore = await cookies()
    const supabase = await getServerClient(cookieStore)

    // 2️⃣ Fetch payment + tenant details
    const { data: payment, error: paymentError } = await supabase
      .from("tenant_payments")
      .select(`
        id,
        amount,
        payment_date,
        payment_period,
        tenant:tenant_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          currency,
          balance,
          monthly_rent,
          prepaid_balance,
          property_id,
          unit_id,
          property:property_id (
            id,
            name
          ),
          unit:unit_id (
            id,
            unit_number,
            status,
            bedrooms,
            bathrooms,
            monthly_rent
          )
        )
      `)
      .eq("id", id)
      .single()

    if (paymentError || !payment) {
      log.error("Payment not found", paymentError, { paymentId: id })
      return notFoundResponse("Payment")
    }

    if (!payment.tenant || !Array.isArray(payment.tenant) || payment.tenant.length === 0) {
      log.warn("Tenant not found for payment", { paymentId: id })
      return notFoundResponse("Tenant")
    }

    const tenant = payment.tenant[0]

    // 3️⃣ Fetch tenant payment history (ONLY this tenant)
    const { data: paymentsHistory, error: historyError } = await supabase
      .from("tenant_payments")
      .select("amount, payment_date, payment_period")
      .eq("tenant_id", tenant.id)
      .order("payment_date", { ascending: true })

    if (historyError) {
      log.error("Failed to fetch payment history", historyError)
    }

    const history = paymentsHistory || []

    // 4️⃣ Calculate balance at payment time
    const totalPaid = history.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    )

    const monthlyRent = tenant.monthly_rent || 0
    const balanceAtPayment = Math.max(0, monthlyRent - totalPaid)

    // 5️⃣ Build payment breakdown
    const paymentBreakdown: {
      month: string
      amount: number
      type: "full_payment" | "partial_payment" | "overpayment_credit"
    }[] = []

    let remainingAmount = payment.amount
    const currentPeriod = payment.payment_period

    if (currentPeriod && remainingAmount > 0) {
      const previousPayments = history.filter(
        (p) => p.payment_date < payment.payment_date
      )

      const previouslyPaid = previousPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      )

      const outstanding = Math.max(0, monthlyRent - previouslyPaid)

      if (outstanding > 0) {
        const applied = Math.min(remainingAmount, outstanding)

        paymentBreakdown.push({
          month: currentPeriod,
          amount: applied,
          type:
            applied === outstanding
              ? "full_payment"
              : "partial_payment",
        })

        remainingAmount -= applied
      }

      // Overpayment → next month credit
      if (remainingAmount > 0) {
        const nextMonth = new Date(`${currentPeriod}-01`)
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        paymentBreakdown.push({
          month: nextMonth.toISOString().slice(0, 7),
          amount: remainingAmount,
          type: "overpayment_credit",
        })
      }
    }

    // 6️⃣ Return receipt
    return successResponse({
      ...payment,
      tenant: {
        ...tenant,
        balanceAtPayment,
      },
      property: tenant.property,
      unit: tenant.unit,
      paymentBreakdown,
    })
  } catch (error) {
    return handleApiError(error, "payments:[id]:receipt:GET")
  }
}
