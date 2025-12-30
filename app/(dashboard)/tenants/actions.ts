"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function getProperties() {
  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase.from("properties").select("id, name, property_type").order("name")

    if (error) {
      console.error("[v0] Error fetching properties:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("[v0] getProperties failed:", error)
    return []
  }
}

export async function getVacantUnits(propertyId: string) {
  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from("units")
      .select("id, unit_number, monthly_rent, currency")
      .eq("property_id", propertyId)
      .in("status", ["vacant", "Under Maintenance"])
      .order("unit_number")

    if (error) {
      console.error("[v0] Error fetching units:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("[v0] getVacantUnits failed:", error)
    return []
  }
}

export async function createTenant(formData: FormData) {
  try {
    const supabase = getServiceClient()

    const unitId = formData.get("unit_id") as string | null
    const tenantData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      property_id: formData.get("property_id") as string,
      unit_id: unitId || null,
      unit_number: formData.get("unit_number") as string,
      lease_start_date: formData.get("start_date") as string,
      monthly_rent: Number.parseFloat(formData.get("monthly_rent") as string) || 0,
      deposit_amount: Number.parseFloat(formData.get("deposit_amount") as string) || 0,
      currency: formData.get("currency") as string,
      rent_due_day: Number.parseInt(formData.get("rent_due_day") as string) || 1,
      status: "active",
      payment_status: "pending",
    }

    const { data, error } = await supabase.from("tenants").insert([tenantData]).select().single()

    if (error) {
      console.error("[v0] Error creating tenant:", error)
      return { success: false, error: error.message }
    }

    // If a unit was selected, mark it as occupied
    if (unitId) {
      await supabase.from("units").update({ status: "occupied" }).eq("id", unitId)
    }

    revalidatePath("/tenants")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] createTenant failed:", error)
    return { success: false, error: error.message || "Failed to create tenant" }
  }
}

export async function getTenant(id: string) {
  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase.from("tenants").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Error fetching tenant:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("[v0] getTenant failed:", error)
    return null
  }
}

export async function updateTenant(id: string, formData: FormData) {
  try {
    const supabase = getServiceClient()

    const oldTenantData = await getTenant(id)
    const oldUnitId = oldTenantData?.unit_id

    const rawUnitId = formData.get("unit_id") as string | null
    const newUnitId = rawUnitId === "none" || !rawUnitId ? null : rawUnitId

    let monthlyRent = Number.parseFloat(formData.get("monthly_rent") as string) || 0

    if (newUnitId && newUnitId !== oldUnitId) {
      const { data: unitData } = await supabase.from("units").select("monthly_rent").eq("id", newUnitId).single()

      if (unitData?.monthly_rent) {
        monthlyRent = unitData.monthly_rent
      }
    }

    const tenantData = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      property_id: formData.get("property_id") as string,
      unit_id: newUnitId,
      unit_number: formData.get("unit_number") as string,
      lease_start_date: formData.get("start_date") as string,
      monthly_rent: monthlyRent,
      deposit_amount: Number.parseFloat(formData.get("deposit_amount") as string) || 0,
      currency: formData.get("currency") as string,
      rent_due_day: Number.parseInt(formData.get("rent_due_day") as string) || 1,
      status: formData.get("status") as string,
      payment_status: formData.get("payment_status") as string,
    }

    const { data, error } = await supabase.from("tenants").update(tenantData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating tenant:", error)
      return { success: false, error: error.message }
    }

    // Handle unit status changes
    // If unit changed, mark old unit as vacant and new unit as occupied
    if (oldUnitId !== newUnitId) {
      if (oldUnitId) {
        await supabase.from("units").update({ status: "vacant" }).eq("id", oldUnitId)
      }
      if (newUnitId) {
        await supabase.from("units").update({ status: "occupied" }).eq("id", newUnitId)
      }
    }

    revalidatePath("/tenants")
    revalidatePath("/dashboard")

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] updateTenant failed:", error)
    return { success: false, error: error.message || "Failed to update tenant" }
  }
}

export async function toggleTenantStatus(tenantId: string, newStatus: "active" | "inactive") {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", tenantId)

    if (error) {
      console.error("[v0] Error updating tenant status:", error)
      throw new Error(error.message)
    }

    revalidatePath("/tenants")
    revalidatePath("/reports")
    revalidatePath("/dashboard")
  } catch (error: any) {
    console.error("[v0] toggleTenantStatus failed:", error)
    throw error
  }
}
