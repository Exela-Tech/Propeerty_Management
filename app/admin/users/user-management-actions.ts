"use server"

import { createClient } from "@/lib/supabase/server"
import { getServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/permissions"

export async function getPendingRegistrations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_registrations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching registrations:", error)
    return []
  }

  return data || []
}

export async function approveRegistration(registrationId: string, assignedRole: string) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Get registration details
  const { data: registration } = await supabase.from("user_registrations").select("*").eq("id", registrationId).single()

  if (!registration) {
    return { error: "Registration not found" }
  }

  // Generate temporary password
  const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`

  // Create auth user using service client
  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: registration.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: registration.first_name,
      last_name: registration.last_name,
    },
  })

  if (authError) {
    console.error(" Auth creation error:", authError)
    return { error: "Failed to create user account" }
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authUser.user.id,
    email: registration.email,
    first_name: registration.first_name,
    last_name: registration.last_name,
    phone: registration.phone,
    role: assignedRole,
    is_admin: assignedRole === "admin",
    requires_password_change: true,
    is_active: true,
    created_by: currentUser.id,
    status: "active",
  })

  if (profileError) {
    console.error(" Profile creation error:", profileError)
    return { error: "Failed to create user profile" }
  }

  // Update registration status
  await supabase
    .from("user_registrations")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUser.id,
    })
    .eq("id", registrationId)

  // Log activity
  await logActivity(currentUser.id, "approve_registration", "users", authUser.user.id, {
    email: registration.email,
    assigned_role: assignedRole,
  })

  revalidatePath("/admin/users")

  return { success: true, tempPassword, email: registration.email }
}

export async function rejectRegistration(registrationId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("user_registrations")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: currentUser.id,
    })
    .eq("id", registrationId)

  if (error) {
    return { error: "Failed to reject registration" }
  }

  await logActivity(currentUser.id, "reject_registration", "users", registrationId, { reason })

  revalidatePath("/admin/users")

  return { success: true }
}

export async function createUserManually(formData: {
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: string
}) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Generate temporary password
  const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`

  // Create auth user
  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: formData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: formData.first_name,
      last_name: formData.last_name,
    },
  })

  if (authError) {
    console.error(" Auth creation error:", authError)
    return { error: "Failed to create user account" }
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authUser.user.id,
    email: formData.email,
    first_name: formData.first_name,
    last_name: formData.last_name,
    phone: formData.phone,
    role: formData.role,
    is_admin: formData.role === "admin",
    requires_password_change: true,
    is_active: true,
    created_by: currentUser.id,
    status: "active",
  })

  if (profileError) {
    console.error(" Profile creation error:", profileError)
    return { error: "Failed to create user profile" }
  }

  await logActivity(currentUser.id, "create_user", "users", authUser.user.id, {
    email: formData.email,
    role: formData.role,
  })

  revalidatePath("/admin/users")

  return { success: true, tempPassword, email: formData.email, userId: authUser.user.id }
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      is_admin: newRole === "admin",
    })
    .eq("id", userId)

  if (error) {
    return { error: "Failed to update role" }
  }

  await logActivity(currentUser.id, "update_user_role", "users", userId, { new_role: newRole })

  revalidatePath("/admin/users")

  return { success: true }
}

export async function disableUser(userId: string, reason: string) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Disable in auth
  await serviceClient.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // 100 years
  })

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: false,
      disabled_at: new Date().toISOString(),
      disabled_by: currentUser.id,
      disabled_reason: reason,
    })
    .eq("id", userId)

  if (error) {
    return { error: "Failed to disable user" }
  }

  await logActivity(currentUser.id, "disable_user", "users", userId, { reason })

  revalidatePath("/admin/users")

  return { success: true }
}

export async function enableUser(userId: string) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Enable in auth
  await serviceClient.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  })

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: true,
      disabled_at: null,
      disabled_by: null,
      disabled_reason: null,
    })
    .eq("id", userId)

  if (error) {
    return { error: "Failed to enable user" }
  }

  await logActivity(currentUser.id, "enable_user", "users", userId)

  revalidatePath("/admin/users")

  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Delete from auth
  await serviceClient.auth.admin.deleteUser(userId)

  // Delete profile
  const { error } = await supabase.from("profiles").delete().eq("id", userId)

  if (error) {
    return { error: "Failed to delete user" }
  }

  await logActivity(currentUser.id, "delete_user", "users", userId)

  revalidatePath("/admin/users")

  return { success: true }
}

export async function getAllUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching users:", error)
    return []
  }

  return data || []
}

export async function getPendingTeamMembers() {
  const supabase = await createClient()

  // Get pending team members that don't have a user account yet
  const { data: teamMembers, error: teamError } = await supabase
    .from("team_members")
    .select("*")
    .eq("status", "pending")
    .order("invited_at", { ascending: false })

  if (teamError) {
    console.error(" Error fetching team members:", teamError)
    return []
  }

  if (!teamMembers || teamMembers.length === 0) {
    return []
  }

  // Check which team members already have user accounts
  const emails = teamMembers.map((tm) => tm.email)
  const { data: existingUsers } = await supabase.from("profiles").select("email").in("email", emails)

  const existingEmails = new Set(existingUsers?.map((u) => u.email) || [])

  // Return only team members without user accounts
  return teamMembers.filter((tm) => !existingEmails.has(tm.email))
}

export async function approveTeamMember(teamMemberId: string, assignedRole?: string) {
  const supabase = await createClient()
  const serviceClient = await getServiceClient()

  // Get current user
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: "Unauthorized" }
  }

  // Get team member details
  const { data: teamMember, error: teamError } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", teamMemberId)
    .single()

  if (teamError || !teamMember) {
    return { error: "Team member not found" }
  }

  // Check if user already exists
  const { data: existingUser } = await supabase.from("profiles").select("id").eq("email", teamMember.email).single()

  if (existingUser) {
    return { error: "User account already exists for this email" }
  }

  // Use assigned role or team member's role
  const role = assignedRole || teamMember.role

  // Generate temporary password
  const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`

  // Create auth user using service client
  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: teamMember.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: teamMember.first_name,
      last_name: teamMember.last_name,
    },
  })

  if (authError) {
    console.error(" Auth creation error:", authError)
    return { error: "Failed to create user account" }
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authUser.user.id,
    email: teamMember.email,
    first_name: teamMember.first_name,
    last_name: teamMember.last_name,
    role: role,
    is_admin: role === "admin",
    requires_password_change: true,
    is_active: true,
    created_by: currentUser.id,
    status: "active",
  })

  if (profileError) {
    console.error(" Profile creation error:", profileError)
    return { error: "Failed to create user profile" }
  }

  // Update team member status to active
  await supabase
    .from("team_members")
    .update({
      status: "active",
      invitation_token: null,
    })
    .eq("id", teamMemberId)

  // Log activity
  await logActivity(currentUser.id, "approve_team_member", "users", authUser.user.id, {
    email: teamMember.email,
    assigned_role: role,
    team_member_id: teamMemberId,
  })

  revalidatePath("/admin/users")
  revalidatePath("/team")

  return { success: true, tempPassword, email: teamMember.email }
}
