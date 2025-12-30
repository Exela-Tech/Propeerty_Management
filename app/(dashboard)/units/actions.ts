"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function getProperties() {
  const { data, error } = await supabase.from("properties").select("id, name, property_type").order("name")

  if (error) {
    console.error("Error fetching properties:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function createUnit(formData: FormData) {
  const property_id = formData.get("property_id") as string
  const unit_number = formData.get("unit_number") as string
  const bedrooms = formData.get("bedrooms") ? Number.parseInt(formData.get("bedrooms") as string) : null
  const bathrooms = formData.get("bathrooms") ? Number.parseFloat(formData.get("bathrooms") as string) : null
  const square_feet = formData.get("square_feet") ? Number.parseInt(formData.get("square_feet") as string) : null
  const rent_amount = Number.parseFloat(formData.get("rent_amount") as string) || 0
  const currency = (formData.get("currency") as string) || "UGX"
  const status = formData.get("status") || "vacant"

  const { data, error } = await supabase
    .from("units")
    .insert([
      {
        property_id,
        unit_number,
        bedrooms,
        bathrooms,
        square_feet,
        monthly_rent: rent_amount,
        currency,
        status,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating unit:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/units")
  revalidatePath("/dashboard")

  return { success: true, data }
}

export async function getUnit(id: string) {
  const { data, error } = await supabase.from("units").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching unit:", error)
    return { success: false, error: error.message, data: null }
  }

  return { success: true, data }
}

export async function updateUnit(id: string, formData: FormData) {
  const property_id = formData.get("property_id") as string
  const unit_number = formData.get("unit_number") as string
  const bedrooms = formData.get("bedrooms") ? Number.parseInt(formData.get("bedrooms") as string) : null
  const bathrooms = formData.get("bathrooms") ? Number.parseFloat(formData.get("bathrooms") as string) : null
  const square_feet = formData.get("square_feet") ? Number.parseInt(formData.get("square_feet") as string) : null
  const rent_amount = Number.parseFloat(formData.get("rent_amount") as string) || 0
  const currency = (formData.get("currency") as string) || "UGX"
  const status = formData.get("status") || "vacant"

  const { data, error } = await supabase
    .from("units")
    .update({
      property_id,
      unit_number,
      bedrooms,
      bathrooms,
      square_feet,
      monthly_rent: rent_amount,
      currency,
      status,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating unit:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/units")
  revalidatePath("/dashboard")

  return { success: true, data }
}

export async function deleteUnit(unitId: string) {
  const { error } = await supabase.from("units").delete().eq("id", unitId)

  if (error) {
    console.error("Error deleting unit:", error)
    throw new Error(error.message)
  }

  revalidatePath("/units")
  revalidatePath("/dashboard")
}
