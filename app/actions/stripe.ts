"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

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
          unit_amount: Math.round(payment.amount * 100), // Convert to cents
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
