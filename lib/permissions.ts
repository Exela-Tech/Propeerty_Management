"use server"

import { createClient } from "@/lib/supabase/server"

export interface Permission {
  resource: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_approve: boolean
}

export async function getUserPermissions(role: string): Promise<Permission[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("role_permissions").select("*").eq("role", role)

  if (error) {
    console.error("[v0] Error fetching permissions:", error)
    return []
  }

  return data || []
}

export async function hasPermission(
  role: string,
  resource: string,
  action: "view" | "create" | "edit" | "delete" | "approve",
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("role", role)
    .eq("resource", resource)
    .single()

  if (error || !data) return false

  const permissionKey = `can_${action}` as keyof typeof data
  return data[permissionKey] === true
}

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
) {
  const supabase = await createClient()

  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    details,
  })
}
