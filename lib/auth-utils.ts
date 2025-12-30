import { createClient } from "@/lib/supabase/server"

export type UserRole = "admin" | "landlord" | "tenant"

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: UserRole
  is_admin: boolean
}

export async function ensureUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  let { data: profile, error: fetchError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  // If no profile exists, create one
  if (!profile) {
    const firstName =
      user.user_metadata?.first_name ||
      user.user_metadata?.full_name?.split(" ")[0] ||
      user.email?.split("@")[0] ||
      "User"
    const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(" ")[1] || ""

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName,
        role: "landlord",
        is_admin: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Failed to create profile:", error.message)
      return null
    }

    profile = newProfile
  }

  return {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role || "landlord",
    is_admin: profile.is_admin || false,
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role || "landlord",
    is_admin: profile.is_admin || false,
  }
}

export async function checkUserRole(allowedRoles: UserRole[]): Promise<boolean> {
  const profile = await getCurrentUserProfile()

  if (!profile) return false

  return allowedRoles.includes(profile.role)
}

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAdmin() {
  const profile = await getCurrentUserProfile()

  return profile?.is_admin || false
}
