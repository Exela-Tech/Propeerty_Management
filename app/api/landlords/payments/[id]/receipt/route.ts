import { createClient } from "@supabase/supabase-js"
import { successResponse, notFoundResponse, handleApiError } from "@/lib/api-response"
import { validateUUID } from "@/lib/api-validation"
import { logger } from "@/lib/logger"

const log = logger.child("api:landlords:payments:receipt")

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceClient()
    const { id } = await params

    // Validate UUID format
    if (!validateUUID(id)) {
      return notFoundResponse("Payment")
    }

    const { data: payment, error: paymentError } = await supabase
      .from("landlord_payments")
      .select("*")
      .eq("id", id)
      .single()

    if (paymentError || !payment) {
      log.error("Payment not found", paymentError, { paymentId: id })
      return notFoundResponse("Payment")
    }

    // Get landlord information
    const { data: landlord, error: landlordError } = await supabase
      .from("owners")
      .select("*")
      .eq("id", payment.landlord_id)
      .single()

    if (landlordError || !landlord) {
      log.error("Landlord not found", landlordError, { landlordId: payment.landlord_id, paymentId: id })
      return notFoundResponse("Landlord")
    }

    // Get all properties for this landlord
    const { data: properties } = await supabase
      .from("properties")
      .select("id, name, address")
      .eq("owner_id", payment.landlord_id)

    // Get all tenants for these properties
    const propertyIds = properties?.map((p) => p.id) || []
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, first_name, last_name, monthly_rent, property_id")
      .in("property_id", propertyIds)
      .eq("status", "active")

    // Get rent collected during the payment period
    const tenantIds = tenants?.map((t) => t.id) || []
    const { data: rentCollected } = await supabase
      .from("tenant_payments")
      .select("amount, payment_date, tenant_id")
      .in("tenant_id", tenantIds)
      .gte("payment_date", payment.period_start)
      .lte("payment_date", payment.period_end)

    const totalRentCollected = rentCollected?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Get all previous payments to this landlord in the same period
    const { data: previousPayments } = await supabase
      .from("landlord_payments")
      .select("amount, payment_date, receipt_number")
      .eq("landlord_id", payment.landlord_id)
      .gte("payment_date", payment.period_start)
      .lte("payment_date", payment.period_end)
      .lt("payment_date", payment.payment_date)

    const totalPreviousPayments = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const amountOwed = Math.max(0, totalRentCollected - totalPreviousPayments - payment.amount)

    // Calculate expected rent for the period
    const expectedRent = tenants?.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) || 0

    return successResponse({
      ...payment,
      landlord: {
        id: landlord.id,
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone,
        address: landlord.address,
        city: landlord.city,
        payment_due_day: landlord.payment_due_day,
      },
      properties: properties || [],
      tenantCount: tenants?.length || 0,
      expectedRent,
      totalRentCollected,
      totalPreviousPayments,
      amountOwed,
      remainingBalance: amountOwed,
    })
  } catch (error) {
    return handleApiError(error, "landlords:payments:[id]:receipt:GET")
  }
}
