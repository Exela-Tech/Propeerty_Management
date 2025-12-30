"use server"

import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getMonthlyRentCollection() {
  const supabase = getServiceClient()
  const { data: tenants } = await supabase
    .from("tenants")
    .select(
      "*, unit:unit_id(unit_number), property:property_id(name, landlord_id), landlord:property_id(owner:landlord_id(name))",
    )
    .eq("status", "active")

  return (
    tenants?.map((t) => ({
      id: t.id,
      tenantName: `${t.first_name} ${t.last_name}`,
      property: t.property?.name,
      landlordName: t.property?.owner?.name,
      unit: t.unit?.unit_number,
      monthlyRent: Number.parseFloat(t.monthly_rent || "0"),
      totalPaid: Number.parseFloat(t.total_paid || "0"),
      paymentStatus: t.payment_status,
      lastPaymentDate: t.last_payment_date,
    })) || []
  )
}

export async function getOutstandingRent() {
  const supabase = getServiceClient()
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*, unit:unit_id(unit_number), property:property_id(name)")
    .eq("status", "active")
    .gt("balance", 0)
    .order("balance", { ascending: false })

  return (
    tenants?.map((t) => ({
      id: t.id,
      tenantName: `${t.first_name} ${t.last_name}`,
      property: t.property?.name,
      unit: t.unit?.unit_number,
      monthlyRent: Number.parseFloat(t.monthly_rent || "0"),
      daysOverdue: Math.floor(
        (Date.now() - new Date(t.lease_start_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24),
      ),
      outstandingBalance: Number.parseFloat(t.balance || "0"),
    })) || []
  )
}

export async function getExpenseSummary() {
  const supabase = getServiceClient()
  const { data: transactions } = await supabase.from("transactions").select("*").eq("type", "expense")

  const totalExpenses = transactions?.reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0) || 0
  const byCategory = transactions?.reduce((acc: Record<string, number>, t) => {
    const category = t.category || "Other"
    acc[category] = (acc[category] || 0) + Number.parseFloat(t.amount || "0")
    return acc
  }, {})

  return { totalExpenses, byCategory }
}

export async function getLandlordStatements() {
  const supabase = getServiceClient()
  const { data: landlords } = await supabase.from("owners").select("*").order("name")

  if (!landlords) return []

  const { data: properties } = await supabase.from("properties").select("*")
  const { data: tenants } = await supabase.from("tenants").select("*").eq("status", "active")

  return landlords.map((landlord) => {
    const landlordProperties = (properties || []).filter((p) => p.landlord_id === landlord.id)
    const propertyIds = landlordProperties.map((p) => p.id)
    const landlordTenants = (tenants || []).filter((t) => propertyIds.includes(t.property_id))

    const totalRent = landlordTenants.reduce((sum, t) => sum + Number.parseFloat(t.monthly_rent || "0"), 0)
    const commission = totalRent * 0.1
    const payout = totalRent - commission

    return {
      landlordName: landlord.name,
      email: landlord.email,
      properties: landlordProperties.length,
      tenants: landlordTenants.length,
      totalMonthlyRent: totalRent,
      commission,
      landlordPayout: payout,
    }
  })
}

export async function getOutstandingRentFiltered(filters?: {
  propertyId?: string
  landlordId?: string
  minDaysOverdue?: number
}) {
  const supabase = getServiceClient()
  let query = supabase
    .from("tenants")
    .select("*, unit:unit_id(unit_number), property:property_id(name, landlord_id)")
    .eq("status", "active")
    .gt("balance", 0)
    .order("balance", { ascending: false })

  if (filters?.propertyId) {
    query = query.eq("property_id", filters.propertyId)
  }

  if (filters?.landlordId) {
    query = query.eq("property.landlord_id", filters.landlordId)
  }

  const { data: tenants } = await query

  return (
    tenants?.map((t) => ({
      id: t.id,
      tenantName: `${t.first_name} ${t.last_name}`,
      property: t.property?.name,
      landlordId: t.property?.landlord_id,
      unit: t.unit?.unit_number,
      monthlyRent: Number.parseFloat(t.monthly_rent || "0"),
      daysOverdue: Math.floor(
        (Date.now() - new Date(t.lease_start_date || Date.now()).getTime()) / (1000 * 60 * 60 * 24),
      ),
      outstandingBalance: Number.parseFloat(t.balance || "0"),
    })) || []
  )
}

export async function getPropertiesForFilter() {
  const supabase = getServiceClient()
  const { data } = await supabase.from("properties").select("id, name").order("name")
  return data || []
}

export async function getLandlordsForFilter() {
  const supabase = getServiceClient()
  const { data } = await supabase.from("owners").select("id, name").order("name")
  return data || []
}

export async function getExpensesList() {
  const supabase = getServiceClient()
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, property:property_id(name)")
    .eq("type", "expense")
    .order("transaction_date", { ascending: false })

  return (
    transactions?.map((t) => ({
      id: t.id,
      description: t.description || "No description",
      category: t.category || "other",
      property: t.property?.name || null,
      amount: Number.parseFloat(t.amount || "0"),
      currency: t.currency || "UGX",
      transaction_date: t.transaction_date,
    })) || []
  )
}

export async function getMonthlyCollectionProgress(month: string) {
  const supabase = getServiceClient()

  // Parse month string (format: "YYYY-MM")
  const [year, monthNum] = month.split("-")

  // Get all active tenants with their details
  const { data: tenants } = await supabase
    .from("tenants")
    .select(
      "*, property:property_id(name, landlord_id), landlord:property_id(owner:landlord_id(name)), unit:unit_id(unit_number)",
    )
    .eq("status", "active")
    .order("first_name")

  if (!tenants) return []

  // Get all payments for this month for each tenant
  const { data: payments } = await supabase.from("tenant_payments").select("*").eq("payment_period", month)

  return tenants.map((t) => {
    const tenantPayments = (payments || []).filter((p) => p.tenant_id === t.id && p.payment_period === month)
    const amountPaid = tenantPayments.reduce((sum, p) => sum + Number.parseFloat(p.amount || "0"), 0)
    const monthlyRent = Number.parseFloat(t.monthly_rent || "0")
    const isPaid = amountPaid >= monthlyRent
    const balance = monthlyRent - amountPaid

    return {
      id: t.id,
      tenantName: `${t.first_name} ${t.last_name}`,
      propertyName: t.property?.name,
      landlordName: t.property?.owner?.name,
      unitNumber: t.unit?.unit_number,
      monthlyRent,
      amountPaid,
      balance: balance > 0 ? balance : 0,
      isPaid,
      paymentStatus: isPaid ? "Paid" : amountPaid > 0 ? "Partial" : "Pending",
      rentDueDay: t.rent_due_day || 1,
    }
  })
}

export async function getAvailableMonths() {
  const supabase = getServiceClient()
  const { data: payments } = await supabase
    .from("tenant_payments")
    .select("payment_period")
    .distinct()
    .not("payment_period", "is", null)
    .order("payment_period", { ascending: false })

  return [...new Set(payments?.map((p) => p.payment_period) || [])].filter((m) => m)
}
