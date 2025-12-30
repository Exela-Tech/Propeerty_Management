"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function getCurrentUser() {
  const supabase = getServiceClient()

  // Get all users and find the one with admin role
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers()

  if (error || !users || users.length === 0) {
    throw new Error("Unable to get admin user")
  }

  // Get the first user (super admin) or implement logic to find current user
  return users[0].id
}

export async function createTeamMember(formData: {
  firstName: string
  lastName: string
  email: string
  role: string
}) {
  try {
    const supabase = getServiceClient()

    const userId = await getCurrentUser()

    const { data, error } = await supabase
      .from("team_members")
      .insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          role: formData.role,
          status: "pending",
          invitation_token: Math.random().toString(36).substring(2, 15),
          invited_at: new Date().toISOString(),
          created_by: userId,
        },
      ])
      .select()

    if (error) throw error

    revalidatePath("/team")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating team member:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create team member",
    }
  }
}

export async function getTeamMembers() {
  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase.from("team_members").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching team members:", error)
    return []
  }
}

export async function deleteTeamMember(id: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase.from("team_members").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/team")
    return { success: true }
  } catch (error) {
    console.error("Error deleting team member:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete team member",
    }
  }
}

export async function updateTeamMember(
  id: string,
  formData: {
    firstName: string
    lastName: string
    email: string
    role: string
    status: string
  },
) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from("team_members")
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      })
      .eq("id", id)

    if (error) throw error

    revalidatePath("/team")
    return { success: true }
  } catch (error) {
    console.error("Error updating team member:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update team member",
    }
  }
}
