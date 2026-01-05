"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

const log = logger.child("landlords:actions")

export async function createLandlord(formData: FormData) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const landlordData = {
    name: `${formData.get("first_name")} ${formData.get("last_name")}`,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    notes: formData.get("notes") as string,
    payment_due_day: Number.parseInt(formData.get("payment_due_day") as string) || 30,
    landlord_id: null,
  }

  const { error } = await supabase.from("owners").insert([landlordData])

  if (error) {
    log.error("Error creating landlord", error)
    if (error.code === "23502" && error.message.includes("landlord_id")) {
      return {
        error:
          "Database configuration error: Please run SQL script 010_fix_owners_table_for_landlords.sql to make landlord_id nullable",
      }
    }
    return { error: error.message }
  }

  log.info("Landlord created successfully")
  revalidatePath("/landlords")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function updateLandlord(id: string, formData: FormData) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const landlordData = {
    name: `${formData.get("first_name")} ${formData.get("last_name")}`,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    notes: formData.get("notes") as string,
    payment_due_day: Number.parseInt(formData.get("payment_due_day") as string) || 30,
    commission_percentage: Number.parseFloat(formData.get("commission_percentage") as string) || 10,
  }

  const { error } = await supabase.from("owners").update(landlordData).eq("id", id)

  if (error) {
    log.error("Error updating landlord", error, { landlordId: id })
    return { error: error.message }
  }

  log.info("Landlord updated successfully", { landlordId: id })
  revalidatePath("/landlords")
  revalidatePath("/dashboard")

  return { success: true }
}

export async function deleteLandlord(id: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { error } = await supabase.from("owners").delete().eq("id", id)

  if (error) {
    log.error("Error deleting landlord", error, { landlordId: id })
    return { error: error.message, success: false }
  }

  log.info("Landlord deleted successfully", { landlordId: id })
  revalidatePath("/landlords")
  revalidatePath("/dashboard")

  return { success: true }
}
