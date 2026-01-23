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

  // Get properties with commission settings
  const { data: propertiesWithCommission } = await supabase
    .from("properties")
    .select("id, commission_type, commission_value")
    .in("id", propertyIds)

  // Calculate commission per property based on collected rent
  let totalCommissionDeducted = 0
  for (const prop of propertiesWithCommission || []) {
    const propTenants = tenants.filter(t => t.property_id === prop.id)
    const propCollected = payments
      ?.filter(p => propTenants.some(t => t.id === p.tenant_id))
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    
    const commissionType = prop.commission_type || "percentage"
    const commissionValue = prop.commission_value || 10
    
    if (commissionType === "fixed") {
      totalCommissionDeducted += commissionValue
    } else {
      totalCommissionDeducted += (propCollected * commissionValue) / 100
    }
  }

  const commissionDeducted = totalCommissionDeducted
  const netPayout = totalCollected - commissionDeducted

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

  const commissionPercentage = 10 // Declare commissionPercentage here

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
  const property_id = formData.get("property_id") as string
  const grossAmount = Number.parseFloat(formData.get("amount") as string)
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

  if (!property_id) {
    return { success: false, error: "Property selection is required" }
  }

  // Get landlord name
  const { data: landlord } = await supabase
    .from("owners")
    .select("name")
    .eq("id", landlord_id)
    .single()

  // Get property's commission settings
  const { data: property } = await supabase
    .from("properties")
    .select("commission_type, commission_value, name")
    .eq("id", property_id)
    .single()

  const commissionType = property?.commission_type || "percentage"
  const commissionValue = property?.commission_value || 10
  const commissionPercentage = property?.commission_value || 10 // Declare commissionPercentage here
  
  // Calculate management fee based on commission type
  let managementFee: number
  if (commissionType === "fixed") {
    managementFee = commissionValue
  } else {
    managementFee = (grossAmount * commissionValue) / 100
  }
  const netAmount = grossAmount - managementFee

  const { data: paymentRecord, error } = await supabase
    .from("landlord_payments")
    .insert({
      landlord_id,
      property_id,
      amount: netAmount,
      gross_amount: grossAmount,
      management_fee: managementFee,
      commission_type: commissionType,
      commission_value: commissionValue,
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

  // Post the net payment to landlord and management fee to income
  await postLandlordPaymentToGL(
    supabase,
    netAmount,
    managementFee,
    payment_date,
    landlord_id,
    paymentRecord.id,
    bank_account_id,
    landlord?.name || "Landlord"
  )

  revalidatePath("/landlords/payments")
  revalidatePath("/dashboard")
  revalidatePath("/accounting/cash-management")

  return { 
    success: true, 
    receipt_number, 
    grossAmount, 
    managementFee, 
    netAmount,
    commissionType,
    commissionValue,
    propertyName: property?.name 
  }
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
  netAmount: number,
  managementFee: number,
  payment_date: string,
  landlord_id: string,
  reference_id: string,
  bank_account_id: string,
  landlordName: string,
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

  // Get Landlord Payout Expense account (5020)
  const { data: expenseAccount } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .eq("account_code", "5020")
    .single()

  if (!expenseAccount) {
    console.error(" Missing Landlord Payout Expense account (5020)")
    throw new Error("Landlord expense account not found in chart of accounts")
  }

  // Get Management Fee Income account (4010)
  const { data: incomeAccount } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .eq("account_code", "4010")
    .single()

  if (!incomeAccount) {
    console.error(" Missing Management Fee Income account (4010)")
    throw new Error("Management fee income account not found in chart of accounts")
  }

  const totalAmount = netAmount + managementFee

  // 1. Debit Landlord Expense (what we owe landlord - net amount)
  const { error: expenseError } = await supabase.from("general_ledger").insert({
    account_id: expenseAccount.id,
    debit: netAmount,
    credit: 0,
    transaction_date: payment_date,
    description: `Landlord payout to ${landlordName}`,
    reference_type: "landlord_payment",
    reference_id: reference_id,
  })

  if (expenseError) {
    console.error(" Failed to create expense GL entry:", expenseError)
    throw new Error("Failed to post landlord expense to GL")
  }

  // 2. Credit Management Fee Income (our 10% fee)
  if (managementFee > 0) {
    const { error: incomeError } = await supabase.from("general_ledger").insert({
      account_id: incomeAccount.id,
      debit: 0,
      credit: managementFee,
      transaction_date: payment_date,
      description: `Management fee from ${landlordName}`,
      reference_type: "landlord_payment",
      reference_id: reference_id,
    })

    if (incomeError) {
      console.error(" Failed to create income GL entry:", incomeError)
      throw new Error("Failed to post management fee income to GL")
    }
  }

  // 3. Credit Bank (total amount leaving bank = net to landlord)
  const { error: bankCreditError } = await supabase.from("general_ledger").insert({
    account_id: bankAccount.gl_account_id,
    debit: 0,
    credit: netAmount,
    transaction_date: payment_date,
    description: `Payment to ${landlordName} via ${bankAccount.account_name}`,
    reference_type: "landlord_payment",
    reference_id: reference_id,
  })

  if (bankCreditError) {
    console.error(" Failed to create bank credit GL entry:", bankCreditError)
    throw new Error("Failed to reduce bank balance in GL")
  }
}
