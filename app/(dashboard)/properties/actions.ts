"use server"

import { getServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logger } from "@/lib/logger"

const log = logger.child("properties:actions")

export async function createProperty(formData: FormData) {
  const supabase = getServiceClient()

  const location = formData.get("location") as string

  const propertyData = {
    name: formData.get("name") as string,
    property_type: formData.get("property_type") as string,
    location: location,
    address: location,
    city: location,
    state: "",
    zip_code: "",
    total_units: Number.parseInt(formData.get("total_units") as string) || 0,
    landlord_id: (formData.get("landlord_id") as string) || null,
    owner_id: (formData.get("landlord_id") as string) || null,
    description: (formData.get("description") as string) || null,
  }

  const { data, error } = await supabase.from("properties").insert([propertyData]).select().single()

  if (error) {
    log.error("Error creating property", error)
    throw new Error(error.message)
  }

  log.info("Property created successfully", { propertyId: data?.id })
  revalidatePath("/properties")

  return { success: true, data }
}

export async function updateProperty(formData: FormData) {
  const supabase = getServiceClient()

  const id = formData.get("id") as string
  const location = formData.get("location") as string
  const managementFeeType = formData.get("management_fee_type") as string
  const managementFee = Number.parseFloat(formData.get("management_fee") as string) || 0

  const propertyData = {
    name: formData.get("name") as string,
    property_type: formData.get("property_type") as string,
    location: location,
    address: location,
    city: location,
    total_units: Number.parseInt(formData.get("total_units") as string) || 0,
    owner_id: (formData.get("landlord_id") as string) || null,
    description: (formData.get("description") as string) || null,
    management_fee_type: managementFeeType,
    management_fee: managementFee,
  }

  const { error } = await supabase.from("properties").update(propertyData).eq("id", id)

  if (error) {
    log.error("Error updating property", error, { propertyId: id })
    throw new Error(error.message)
  }

  log.info("Property updated successfully", { propertyId: id })
  revalidatePath("/properties")
  redirect("/properties")
}

export async function deleteProperty(propertyId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("properties").delete().eq("id", propertyId)

  if (error) {
    log.error("Error deleting property", error, { propertyId })
    throw new Error(error.message)
  }

  log.info("Property deleted successfully", { propertyId })
  revalidatePath("/properties")
}
