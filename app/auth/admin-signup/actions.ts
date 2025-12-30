"use server"

import { createClient } from "@/lib/supabase/server"

interface AdminSignUpResult {
  success: boolean
  error?: string
}

export async function adminSignUpAction(formData: FormData): Promise<AdminSignUpResult> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const adminSecretKey = formData.get("adminSecretKey") as string

  const expectedSecretKey = process.env.ADMIN_SECRET_KEY || "SUPER_ADMIN_SECRET_2024"

  if (adminSecretKey !== expectedSecretKey) {
    return { success: false, error: "Invalid admin secret key" }
  }

  const supabase = await createClient()

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "super_admin",
          is_admin: true,
        },
      },
    })

    if (signUpError) {
      return { success: false, error: signUpError.message }
    }

    if (authData.user) {
      // Create profile with super admin role
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: "super_admin",
        is_admin: true,
      })

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      return { success: true }
    }

    return { success: false, error: "Failed to create user" }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred" }
  }
}
