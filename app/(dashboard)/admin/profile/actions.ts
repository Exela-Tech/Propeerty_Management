"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface AdminProfileData {
  first_name: string
  last_name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  company_name?: string
  notes?: string
}

export async function updateAdminProfile(userId: string, data: AdminProfileData) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        company_name: data.company_name,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/profile")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    }
  }
}
