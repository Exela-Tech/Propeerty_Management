"use server"

import { createServerClient } from "@supabase/ssr"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

async function generateLandlordReceiptNumber() {
  const supabase = getServiceClient()
  const { count } = await supabase.from("landlord_payments").select("*", { count: "exact", head: true })
  const nextNumber = (count || 0) + 1
  return `LRP-${String(nextNumber).padStart(4, "0")}`
}

export async function calculateLandlordOwed(landlordId: string, periodStart: string, periodEnd: string) {
  const supabase = getServiceClient()

  // Get all properties for this landlord
  const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", landlordId)

  if (!properties || properties.length === 0) {
    return {
      owed: 0,
      breakdown: [],
      totalCollected: 0,
      totalPaidToLandlord: 0,
      expectedRent: 0,
      collectionRate: 0,
      tenantCount: 0,
      paymentCount: 0,
      propertyBreakdown: [],
    }
  }

  const propertyIds = properties.map((p) => p.id)

  // Get all tenants for these properties
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, monthly_rent, property_id")
    .in("property_id", propertyIds)
    .eq("status", "active")

  if (!tenants || tenants.length === 0) {
    return {
      owed: 0,
      breakdown: [],
      totalCollected: 0,
      totalPaidToLandlord: 0,
      expectedRent: 0,
      collectionRate: 0,
      tenantCount: 0,
      paymentCount: 0,
      propertyBreakdown: [],
    }
  }

  const tenantIds = tenants.map((t) => t.id)

  const expectedRent = tenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)

  // Get payments received from tenants during this period
  const { data: payments } = await supabase
    .from("tenant_payments")
    .select("amount, tenant_id")
    .in("tenant_id", tenantIds)
    .gte("payment_date", periodStart)
    .lte("payment_date", periodEnd)

  const totalCollected = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  // Get landlord data including commission percentage
  const { data: landlord } = await supabase.from("owners").select("commission_percentage").eq("id", landlordId).single()

  const commissionPercentage = landlord?.commission_percentage || 10

  const commissionDeducted = (expectedRent * commissionPercentage) / 100
  const netPayout = expectedRent - commissionDeducted

  // Get previous payments to landlord during this period
  const { data: previousPayments } = await supabase
    .from("landlord_payments")
    .select("amount")
    .eq("landlord_id", landlordId)
    .gte("payment_date", periodStart)
    .lte("payment_date", periodEnd)

  const totalPaidToLandlord = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

  const owed = Math.max(0, netPayout - totalPaidToLandlord)

  const collectionRate = expectedRent > 0 ? (totalCollected / expectedRent) * 100 : 0

  const breakdown = tenants.map((tenant) => {
    const tenantPayments = payments?.filter((p) => p.tenant_id === tenant.id) || []
    const tenantCollected = tenantPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      tenant_id: tenant.id,
      tenant_name: `${tenant.first_name} ${tenant.last_name}`,
      monthly_rent: tenant.monthly_rent,
      property_id: tenant.property_id,
      collected: tenantCollected,
      outstanding: Math.max(0, (tenant.monthly_rent || 0) - tenantCollected),
    }
  })

  const propertyBreakdown = properties.map((prop) => {
    const propTenants = tenants.filter((t) => t.property_id === prop.id)
    const propExpectedRent = propTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0)
    const propCollected =
      payments
        ?.filter((p) => propTenants.some((t) => t.id === p.tenant_id))
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    return {
      property_id: prop.id,
      expected_rent: propExpectedRent,
      collected: propCollected,
      outstanding: Math.max(0, propExpectedRent - propCollected),
      tenant_count: propTenants.length,
      collection_rate: propExpectedRent > 0 ? (propCollected / propExpectedRent) * 100 : 0,
    }
  })

  return {
    owed,
    breakdown,
    totalCollected,
    totalPaidToLandlord,
    expectedRent,
    collectionRate,
    tenantCount: tenants.length,
    paymentCount: payments?.length || 0,
    propertyBreakdown,
    commissionPercentage,
    commissionDeducted,
    netPayout,
  }
}

export async function recordLandlordPayment(formData: FormData) {
  const supabase = getServiceClient()

  const landlord_id = formData.get("landlord_id") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const payment_date = formData.get("payment_date") as string
  const payment_method = formData.get("payment_method") as string
  const period_start = formData.get("period_start") as string
  const period_end = formData.get("period_end") as string
  const notes = formData.get("notes") as string
  const bank_account_id = formData.get("bank_account_id") as string
  const receipt_number = await generateLandlordReceiptNumber()

  if (!bank_account_id) {
    return { success: false, error: "Bank account selection is required" }
  }

  const { data: paymentRecord, error } = await supabase
    .from("landlord_payments")
    .insert({
      landlord_id,
      amount,
      payment_date,
      payment_method,
      period_start,
      period_end,
      receipt_number,
      notes,
      status: "completed",
      bank_account_id,
    })
    .select()
    .single()

  if (error) {
    console.error(" Error recording landlord payment:", error)
    return { success: false, error: error.message }
  }

  await postLandlordPaymentToGL(supabase, amount, payment_date, landlord_id, paymentRecord.id, bank_account_id)

  revalidatePath("/landlords/payments")
  revalidatePath("/dashboard")
  revalidatePath("/accounting/cash-management")

  return { success: true, receipt_number }
}

export async function getLandlordPayments(landlordId: string) {
  const supabase = getServiceClient()

  const { data: payments, error } = await supabase
    .from("landlord_payments")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("payment_date", { ascending: false })

  if (error) {
    console.error(" Error fetching landlord payments:", error)
    return []
  }

  return payments || []
}

async function postLandlordPaymentToGL(
  supabase: any,
  amount: number,
  payment_date: string,
  landlord_id: string,
  reference_id: string,
  bank_account_id: string,
) {
  const { data: bankAccount, error: bankError } = await supabase
    .from("bank_accounts")
    .select("gl_account_id, account_name")
    .eq("id", bank_account_id)
    .single()

  if (bankError || !bankAccount?.gl_account_id) {
    console.error(" Bank account GL linkage not found:", bankError)
    throw new Error("Bank account must be linked to a GL account")
  }

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .eq("account_code", "5020")
    .single()

  if (!accounts) {
    console.error(" Missing Landlord Payout Expense account (5020)")
    throw new Error("Landlord expense account not found in chart of accounts")
  }

  const { data: landlord } = await supabase.from("owners").select("name").eq("id", landlord_id).single()

  const landlordName = landlord?.name || "Landlord"

  const { error: debitError } = await supabase.from("general_ledger").insert({
    account_id: accounts.id,
    debit: amount,
    credit: 0,
    transaction_date: payment_date,
    description: `Landlord payout to ${landlordName}`,
    reference_type: "landlord_payment",
    reference_id: reference_id,
  })

  if (debitError) {
    console.error(" Failed to create debit GL entry:", debitError)
    throw new Error("Failed to post landlord expense to GL")
  }

  const { error: creditError } = await supabase.from("general_ledger").insert({
    account_id: bankAccount.gl_account_id,
    debit: 0,
    credit: amount,
    transaction_date: payment_date,
    description: `Payment to ${landlordName} via ${bankAccount.account_name}`,
    reference_type: "landlord_payment",
    reference_id: reference_id,
  })

  if (creditError) {
    console.error(" Failed to create credit GL entry:", creditError)
    throw new Error("Failed to reduce bank balance in GL")
  }

  console.log(" Landlord payment GL entries created successfully")
}
