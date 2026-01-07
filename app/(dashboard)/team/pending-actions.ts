"use server"

import { getServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createPendingAction(data: {
  teamMemberId: string
  actionType: "tenant_payment" | "landlord_payment" | "expense" | "maintenance" | "invoice"
  actionData: any
  notes?: string
}) {
  try {
    const supabase = getServiceClient()

    const { data: result, error } = await supabase
      .from("pending_actions")
      .insert([
        {
          team_member_id: data.teamMemberId,
          action_type: data.actionType,
          action_data: data.actionData,
          notes: data.notes,
          status: "pending",
        },
      ])
      .select()

    if (error) throw error

    revalidatePath("/team/dashboard")
    revalidatePath("/admin/approvals")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error creating pending action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create pending action",
    }
  }
}

export async function getPendingActions(teamMemberId?: string) {
  try {
    const supabase = getServiceClient()

    let query = supabase
      .from("pending_actions")
      .select(
        `
        *,
        team_member:profiles!team_member_id(first_name, last_name, email),
        reviewer:profiles!reviewed_by(first_name, last_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (teamMemberId) {
      query = query.eq("team_member_id", teamMemberId)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error fetching pending actions:", error)
    return []
  }
}

export async function approveAction(actionId: string, reviewedBy: string) {
  try {
    const supabase = getServiceClient()

    // Get the pending action
    const { data: action, error: fetchError } = await supabase
      .from("pending_actions")
      .select("*")
      .eq("id", actionId)
      .single()

    if (fetchError) throw fetchError

    // Execute the action based on type
    switch (action.action_type) {
      case "tenant_payment":
        await executeTenantPayment(action.action_data, supabase)
        break
      case "landlord_payment":
        await executeLandlordPayment(action.action_data, supabase)
        break
      case "expense":
        await executeExpense(action.action_data, supabase)
        break
      case "maintenance":
        await executeMaintenance(action.action_data, supabase)
        break
      case "invoice":
        await executeInvoice(action.action_data, supabase)
        break
    }

    // Update the pending action status
    const { error: updateError } = await supabase
      .from("pending_actions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
      })
      .eq("id", actionId)

    if (updateError) throw updateError

    revalidatePath("/admin/approvals")
    return { success: true }
  } catch (error) {
    console.error("Error approving action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve action",
    }
  }
}

export async function rejectAction(actionId: string, reviewedBy: string, reason: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from("pending_actions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        rejection_reason: reason,
      })
      .eq("id", actionId)

    if (error) throw error

    revalidatePath("/admin/approvals")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject action",
    }
  }
}

// Helper functions to execute approved actions
async function executeTenantPayment(data: any, supabase: any) {
  const { error } = await supabase.from("tenant_payments").insert([data])
  if (error) throw error
}

async function executeLandlordPayment(data: any, supabase: any) {
  const { error } = await supabase.from("landlord_payments").insert([data])
  if (error) throw error
}

async function executeExpense(data: any, supabase: any) {
  const { error } = await supabase.from("expenses").insert([data])
  if (error) throw error
}

async function executeMaintenance(data: any, supabase: any) {
  const { error } = await supabase.from("maintenance_requests").insert([data])
  if (error) throw error
}

async function executeInvoice(data: any, supabase: any) {
  const { error } = await supabase.from("invoices").insert([data])
  if (error) throw error
}
