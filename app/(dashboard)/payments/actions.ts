"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function generateReceiptNumber() {
  const supabase = getServiceClient()

  // Get the count of existing payments to determine next receipt number
  const { count } = await supabase.from("tenant_payments").select("*", { count: "exact", head: true })

  const nextNumber = (count || 0) + 1
  return String(nextNumber).padStart(4, "0")
}

export async function getTenants() {
  const supabase = getServiceClient()

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(
      "id, first_name, last_name, property_id, unit_id, monthly_rent, currency, rent_due_day, total_paid, balance, prepaid_balance",
    )
    .order("first_name")

  if (error) {
    console.error("Error fetching tenants:", error)
    return []
  }

  const { data: properties } = await supabase.from("properties").select("id, name")
  const { data: units } = await supabase.from("units").select("id, unit_number")

  const propertiesMap = new Map(properties?.map((p) => [p.id, p]) || [])
  const unitsMap = new Map(units?.map((u) => [u.id, u]) || [])

  return (tenants || []).map((tenant) => ({
    ...tenant,
    property: propertiesMap.get(tenant.property_id),
    unit: unitsMap.get(tenant.unit_id),
  }))
}

export async function recordPayment(formData: FormData) {
  const supabase = getServiceClient()

  const tenant_id = formData.get("tenant_id") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const payment_date = formData.get("payment_date") as string
  const payment_method = formData.get("payment_method") as string
  const payment_period = formData.get("payment_period") as string
  const receipt_number = await generateReceiptNumber()

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("balance, monthly_rent, prepaid_balance, total_paid")
    .eq("id", tenant_id)
    .single()

  if (tenantError) {
    console.error("Error fetching tenant:", tenantError)
    return { success: false, error: tenantError.message }
  }

  const currentBalance = tenant?.balance || 0
  const currentPrepaid = tenant?.prepaid_balance || 0

  const amountAfterPrepaid = Math.max(0, amount - currentPrepaid)
  const newPrepaid = Math.max(0, currentPrepaid - amount)
  const amountTowardsCurrent = Math.min(amountAfterPrepaid, currentBalance)
  const newBalance = currentBalance - amountTowardsCurrent
  const overpayment = Math.max(0, amountAfterPrepaid - amountTowardsCurrent)

  const { error: paymentError } = await supabase.from("tenant_payments").insert({
    tenant_id,
    amount,
    payment_date,
    payment_method,
    payment_period,
    status: "completed",
    receipt_number,
    overpayment_credit: overpayment,
  })

  if (paymentError) {
    console.error("Error recording payment:", paymentError)
    return { success: false, error: paymentError.message }
  }

  const newTotalPaid = (tenant?.total_paid || 0) + amount
  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      balance: newBalance,
      prepaid_balance: newPrepaid + overpayment,
      total_paid: newTotalPaid,
      last_payment_date: payment_date,
      payment_status: newBalance <= 0 ? "paid" : "pending",
    })
    .eq("id", tenant_id)

  if (updateError) {
    console.error("Error updating tenant balance:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/payments")
  revalidatePath("/tenants")
  revalidatePath("/financials")
  revalidatePath("/reports")
  revalidatePath("/")

  return { success: true, receipt_number }
}

export async function deletePayment(paymentId: string) {
  const supabase = getServiceClient()

  const { data: payment, error: fetchError } = await supabase
    .from("tenant_payments")
    .select("*")
    .eq("id", paymentId)
    .single()

  if (fetchError || !payment) {
    console.error("[v0] Error fetching payment:", fetchError)
    throw new Error("Payment not found")
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("balance, prepaid_balance, total_paid")
    .eq("id", payment.tenant_id)
    .single()

  if (tenantError) {
    throw new Error("Tenant not found")
  }

  const { error: deleteError } = await supabase.from("tenant_payments").delete().eq("id", paymentId)

  if (deleteError) {
    console.error("[v0] Error deleting payment:", deleteError)
    throw new Error(deleteError.message)
  }

  const reversedBalance = (tenant?.balance || 0) + payment.amount - (payment.overpayment_credit || 0)
  const reversedTotalPaid = Math.max(0, (tenant?.total_paid || 0) - payment.amount)
  const reversedPrepaid = Math.max(0, (tenant?.prepaid_balance || 0) - (payment.overpayment_credit || 0))

  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      balance: reversedBalance,
      prepaid_balance: reversedPrepaid,
      total_paid: reversedTotalPaid,
      payment_status: reversedBalance > 0 ? "pending" : "paid",
    })
    .eq("id", payment.tenant_id)

  if (updateError) {
    console.error("[v0] Error updating tenant after deletion:", updateError)
    throw new Error(updateError.message)
  }

  revalidatePath("/payments")
  revalidatePath("/tenants")
  revalidatePath("/financials")
  revalidatePath("/reports")
  revalidatePath("/")
}

export async function updatePayment(paymentId: string, formData: FormData) {
  const supabase = getServiceClient()

  const newAmount = Number.parseFloat(formData.get("amount") as string)
  const payment_date = formData.get("payment_date") as string
  const payment_method = formData.get("payment_method") as string

  const { data: existingPayment, error: fetchError } = await supabase
    .from("tenant_payments")
    .select("*")
    .eq("id", paymentId)
    .single()

  if (fetchError || !existingPayment) {
    throw new Error("Payment not found")
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("balance, prepaid_balance, total_paid, monthly_rent")
    .eq("id", existingPayment.tenant_id)
    .single()

  if (tenantError) {
    throw new Error("Tenant not found")
  }

  const oldAmount = existingPayment.amount || 0
  const oldOverpayment = existingPayment.overpayment_credit || 0
  const amountDifference = newAmount - oldAmount

  const currentBalance = (tenant?.balance || 0) + oldAmount - oldOverpayment
  const currentPrepaid = (tenant?.prepaid_balance || 0) - oldOverpayment

  const amountAfterPrepaid = Math.max(0, newAmount - currentPrepaid)
  const newPrepaid = Math.max(0, currentPrepaid - newAmount)
  const amountTowardsCurrent = Math.min(amountAfterPrepaid, currentBalance)
  const updatedBalance = currentBalance - amountTowardsCurrent
  const newOverpayment = Math.max(0, amountAfterPrepaid - amountTowardsCurrent)

  const { error: updatePaymentError } = await supabase
    .from("tenant_payments")
    .update({
      amount: newAmount,
      payment_date,
      payment_method,
      overpayment_credit: newOverpayment,
    })
    .eq("id", paymentId)

  if (updatePaymentError) {
    throw new Error(updatePaymentError.message)
  }

  const newTotalPaid = (tenant?.total_paid || 0) + amountDifference
  const { error: updateTenantError } = await supabase
    .from("tenants")
    .update({
      balance: updatedBalance,
      prepaid_balance: newPrepaid + newOverpayment,
      total_paid: newTotalPaid,
      last_payment_date: payment_date,
      payment_status: updatedBalance <= 0 ? "paid" : "pending",
    })
    .eq("id", existingPayment.tenant_id)

  if (updateTenantError) {
    throw new Error(updateTenantError.message)
  }

  revalidatePath("/payments")
  revalidatePath("/tenants")
  revalidatePath("/financials")
  revalidatePath("/reports")
  revalidatePath("/")
}
