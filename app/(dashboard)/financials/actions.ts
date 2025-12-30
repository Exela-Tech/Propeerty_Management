"use server"

import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getLandlordFinancials() {
  const supabase = getServiceClient()

  // Fetch all landlords
  const { data: landlords } = await supabase.from("owners").select("*").order("name")

  if (!landlords) return []

  // Fetch properties, tenants, and units
  const { data: properties } = await supabase.from("properties").select("*")
  const { data: tenants } = await supabase.from("tenants").select("*").eq("status", "active")
  const { data: units } = await supabase.from("units").select("*")

  const propertyMap = new Map(properties?.map((p) => [p.id, p]) || [])
  const unitMap = new Map(units?.map((u) => [u.id, u]) || [])

  // Group tenants by landlord
  const landlordFinancials = landlords.map((landlord) => {
    // Get properties for this landlord
    const landlordProperties = (properties || []).filter((p) => p.landlord_id === landlord.id)
    const propertyIds = landlordProperties.map((p) => p.id)

    // Get tenants for this landlord's properties
    const landlordTenants = (tenants || []).filter((t) => propertyIds.includes(t.property_id))

    // Calculate total monthly rent
    const totalMonthlyRent = landlordTenants.reduce((sum, t) => sum + Number.parseFloat(t.monthly_rent || 0), 0)

    // Calculate total paid this month (simplified - just sum all payments)
    const totalPaid = landlordTenants.reduce((sum, t) => sum + Number.parseFloat(t.total_paid || 0), 0)

    // Calculate total balance
    const totalBalance = landlordTenants.reduce((sum, t) => sum + Number.parseFloat(t.balance || 0), 0)

    // Calculate commission (10% of monthly rent)
    const commission = totalMonthlyRent * 0.1

    // Calculate landlord payout (90% of monthly rent)
    const landlordPayout = totalMonthlyRent - commission

    return {
      landlord,
      properties: landlordProperties.length,
      tenants: landlordTenants.length,
      totalMonthlyRent,
      totalPaid,
      totalBalance,
      commission,
      landlordPayout,
      tenantDetails: landlordTenants.map((t) => ({
        ...t,
        property: propertyMap.get(t.property_id),
        unit: unitMap.get(t.unit_id),
      })),
    }
  })

  return landlordFinancials
}

export async function getPropertyFinancials() {
  const supabase = getServiceClient()

  const { data: properties } = await supabase.from("properties").select("*").order("name")
  const { data: tenants } = await supabase.from("tenants").select("*").eq("status", "active")
  const { data: units } = await supabase.from("units").select("*")
  const { data: landlords } = await supabase.from("owners").select("*")

  const unitMap = new Map(units?.map((u) => [u.id, u]) || [])
  const landlordMap = new Map(landlords?.map((l) => [l.id, l]) || [])

  const propertyFinancials = (properties || []).map((property) => {
    const propertyTenants = (tenants || []).filter((t) => t.property_id === property.id)

    const totalMonthlyRent = propertyTenants.reduce((sum, t) => sum + Number.parseFloat(t.monthly_rent || 0), 0)
    const totalPaid = propertyTenants.reduce((sum, t) => sum + Number.parseFloat(t.total_paid || 0), 0)
    const totalBalance = propertyTenants.reduce((sum, t) => sum + Number.parseFloat(t.balance || 0), 0)

    return {
      property,
      landlord: landlordMap.get(property.landlord_id),
      tenants: propertyTenants.length,
      totalMonthlyRent,
      totalPaid,
      totalBalance,
      tenantDetails: propertyTenants.map((t) => ({
        ...t,
        unit: unitMap.get(t.unit_id),
      })),
    }
  })

  return propertyFinancials
}
