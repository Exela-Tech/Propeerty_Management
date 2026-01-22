import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
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
 * Get service client (bypasses RLS for admin operations)
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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

    log.info("Receipt request received", { paymentId: id })

    // 1️⃣ Validate UUID
    if (!validateUUID(id)) {
      log.warn("Invalid UUID format", { paymentId: id })
      return notFoundResponse("Payment")
    }

    // Use service client to bypass RLS
    const supabase = getServiceClient()

    // 2️⃣ Fetch payment + tenant details
    const { data: payment, error: paymentError } = await supabase
      .from("tenant_payments")
      .select("*")
      .eq("id", id)
      .single()

    if (paymentError) {
      log.error("Supabase error fetching payment", paymentError, { paymentId: id })
    }

    if (paymentError || !payment) {
      log.error("Payment not found", paymentError, { paymentId: id })
      return notFoundResponse("Payment")
    }

    log.info("Payment found", { paymentId: id, tenantId: payment.tenant_id })

    // Fetch tenant separately
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", payment.tenant_id)
      .single()

    if (tenantError || !tenant) {
      log.warn("Tenant not found for payment", { paymentId: id })
      return notFoundResponse("Tenant")
    }

    // Fetch property and unit
    const { data: property } = await supabase
      .from("properties")
      .select("id, name")
      .eq("id", tenant.property_id)
      .single()

    const { data: unit } = await supabase
      .from("units")
      .select("id, unit_number, room_number")
      .eq("id", tenant.unit_id)
      .single()

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

    // 6️⃣ Return receipt with structured data
    return successResponse({
      id: payment.id,
      receipt_number: payment.receipt_number,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_period: payment.payment_period,
      payment_method: payment.payment_method,
      status: payment.status,
      overpayment_credit: payment.overpayment_credit,
      paymentBreakdown,
      tenant: {
        id: tenant.id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email,
        phone: tenant.phone,
        currency: tenant.currency,
        balance: tenant.balance,
        balanceAtPayment,
        prepaid_balance: tenant.prepaid_balance,
        monthly_rent: tenant.monthly_rent,
      },
      property: {
        id: property?.id,
        name: property?.name,
      },
      unit: {
        id: unit?.id,
        unit_number: unit?.unit_number,
        room_number: unit?.room_number,
      },
    })
  } catch (error) {
    return handleApiError(error, "payments:[id]:receipt:GET")
  }
}
