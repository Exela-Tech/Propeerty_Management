"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitRegistration(formData: {
  email: string
  first_name: string
  last_name: string
  phone?: string
  requested_role: string
}) {
  const supabase = await createClient()

  const { data: existingUser, error: checkError } = await supabase
    .from("user_registrations")
    .select("id")
    .eq("email", formData.email)
    .maybeSingle()

  if (checkError && checkError.code !== "PGRST116") {
    console.error(" Error checking existing registration:", checkError)
    return { error: "Failed to check existing registration. Please ensure the database is set up correctly." }
  }

  if (existingUser) {
    return { error: "Email already registered" }
  }

  // Create registration request
  const { error } = await supabase.from("user_registrations").insert({
    email: formData.email,
    first_name: formData.first_name,
    last_name: formData.last_name,
    phone: formData.phone,
    requested_role: formData.requested_role,
    status: "pending",
  })

  if (error) {
    console.error(" Registration error:", error)
    return { error: "Failed to submit registration" }
  }

  return { success: true }
}
