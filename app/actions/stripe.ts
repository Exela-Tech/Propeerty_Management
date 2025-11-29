"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

/**
 * Convert payment amount to Stripe's smallest currency unit
 * @param amount - The payment amount
 * @param currency - The currency code (USD or UGX)
 * @returns The amount in smallest currency unit for Stripe
 */
function convertToStripeAmount(amount: number, currency: string): number {
  // Validate amount
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero")
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Payment amount must be a valid number")
  }

  const currencyUpper = currency.toUpperCase()

  switch (currencyUpper) {
    case "USD":
      // USD uses cents (multiply by 100)
      return Math.round(amount * 100)

    case "UGX":
      // UGX requires special handling:
      // - Multiply by 100 for Stripe's two-decimal representation
      // - Ensure the result is divisible by 100 (whole UGX only)
      const ugxAmount = Math.round(amount * 100)

      // Stripe will round to nearest 100, so we should too
      const roundedAmount = Math.round(ugxAmount / 100) * 100

      if (roundedAmount !== ugxAmount) {
        console.warn(`UGX amount ${amount} was rounded from ${ugxAmount} to ${roundedAmount}`)
      }

      return roundedAmount

    default:
      throw new Error(`Unsupported currency: ${currency}`)
  }
}

export async function createRentPaymentSession(paymentId: string) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: User not authenticated")
  }

  // Get payment details with tenant info
  const { data: payment } = await supabase
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

  if (!payment) {
    throw new Error("Payment not found")
  }

  // Verify user is the renter
  if (payment.tenants.renter_id !== user.id) {
    throw new Error("Unauthorized: You don't have permission to access this payment")
  }

  // Verify payment is not already paid
  if (payment.status === "paid") {
    throw new Error("Payment has already been paid")
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: payment.currency.toLowerCase(),
          product_data: {
            name: `Rent Payment - ${payment.tenants.properties.title}`,
            description: `${payment.tenants.properties.address} - Due ${new Date(payment.due_date).toLocaleDateString()}`,
          },
          unit_amount: convertToStripeAmount(payment.amount, payment.currency),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      payment_id: paymentId,
    },
  })

  return session.client_secret!
}

export async function markPaymentAsPaid(paymentId: string, stripePaymentId: string) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: User not authenticated")
  }

  // Get payment details to verify ownership
  const { data: payment } = await supabase
    .from("rent_payments")
    .select(
      `
      *,
      tenants!rent_payments_tenant_id_fkey(renter_id)
    `,
    )
    .eq("id", paymentId)
    .single()

  if (!payment) {
    throw new Error("Payment not found")
  }

  // Verify user is the renter
  if (payment.tenants.renter_id !== user.id) {
    throw new Error("Unauthorized: You don't have permission to modify this payment")
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

  if (error) throw error

  return { success: true }
}
