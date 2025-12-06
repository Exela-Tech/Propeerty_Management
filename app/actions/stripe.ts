"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { Result, success, failure, createError, ErrorCode, toAppError } from "@/lib/types"
/**
 * Convert payment amount to Stripe's smallest currency unit
 * @param amount - The payment amount
 * @param currency - The currency code (USD or UGX)
 * @returns The amount in smallest currency unit for Stripe
 */
function convertToStripeAmount(amount: number, currency: string): number {
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero")
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Payment amount must be a valid number")
  }

  const currencyUpper = currency.toUpperCase()

  switch (currencyUpper) {
    case "USD":
      return Math.round(amount * 100)

    case "UGX": {
      const ugxAmount = Math.round(amount * 100)
      const roundedAmount = Math.round(ugxAmount / 100) * 100

      if (roundedAmount !== ugxAmount) {
        // Keep a console warning for visibility in server logs
        // eslint-disable-next-line no-console
        console.warn(`UGX amount ${amount} was rounded from ${ugxAmount} to ${roundedAmount}`)
      }

      return roundedAmount
    }

    default:
      throw new Error(`Unsupported currency: ${currency}`)
  }
}

export async function createRentPaymentSession(paymentId: string): Promise<Result<string>> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure(createError(ErrorCode.UNAUTHORIZED, "User not authenticated"))
    }

    // Get payment details with tenant info
    const { data: payment, error: fetchError } = await supabase
      .from("rent_payments")
      .select(
        `
        *,
        tenants!rent_payments_tenant_id_fkey(
          renter_id,
          properties!tenants_property_id_fkey(title, address)
        )
      `,
      )
      .eq("id", paymentId)
      .single()

    if (fetchError) {
      return failure(createError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch payment details",
        { error: fetchError.message }
      ))
    }

    if (!payment) {
      return failure(createError(
        ErrorCode.NOT_FOUND,
        "Payment not found",
        { paymentId }
      ))
    }

    // Verify user is the renter
    if (!payment.tenants || payment.tenants.renter_id !== user.id) {
      return failure(createError(
        ErrorCode.UNAUTHORIZED,
        "You don't have permission to access this payment",
        { paymentId }
      ))
    }

    // Verify payment is not already paid
    if (payment.status === "paid") {
      return failure(createError(
        ErrorCode.VALIDATION_ERROR,
        "Payment has already been paid",
        { paymentId }
      ))
    }

    // Create Stripe checkout session
    const currency = (payment.currency ?? "USD").toLowerCase()

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Rent Payment - ${payment.tenants.properties.title}`,
              description: `${payment.tenants.properties.address} - Due ${new Date(payment.due_date).toLocaleDateString()}`,
            },
            unit_amount: convertToStripeAmount(payment.amount, payment.currency ?? "USD"),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        payment_id: paymentId,
      },
    })

    return success(session.client_secret!)
  } catch (error) {
    return failure(toAppError(error))
  }
}

export async function markPaymentAsPaid(
  paymentId: string,
  stripePaymentId: string
): Promise<Result<{ success: true }>> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return failure(createError(ErrorCode.UNAUTHORIZED, "User not authenticated"))
    }

    // Get payment details to verify ownership
    const { data: payment, error: fetchError } = await supabase
      .from("rent_payments")
      .select(
        `
        *,
        tenants!rent_payments_tenant_id_fkey(renter_id)
      `,
      )
      .eq("id", paymentId)
      .single()

    if (fetchError) {
      return failure(createError(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch payment details",
        { error: fetchError.message }
      ))
    }

    if (!payment) {
      return failure(createError(
        ErrorCode.NOT_FOUND,
        "Payment not found",
        { paymentId }
      ))
    }

    // Verify user is the renter
    if (!payment.tenants || payment.tenants.renter_id !== user.id) {
      return failure(createError(
        ErrorCode.UNAUTHORIZED,
        "You don't have permission to modify this payment",
        { paymentId }
      ))
    }

    // Update payment status
    const { error } = await supabase
      .from("rent_payments")
      .update({
        status: "paid",
        paid_date: new Date().toISOString(),
        stripe_payment_id: stripePaymentId,
      })
      .eq("id", paymentId)

    if (error) {
      return failure(createError(
        ErrorCode.DATABASE_ERROR,
        "Failed to mark payment as paid",
        { error: error.message, paymentId }
      ))
    }

    return success({ success: true })
  } catch (error) {
    return failure(toAppError(error))
  }
}

