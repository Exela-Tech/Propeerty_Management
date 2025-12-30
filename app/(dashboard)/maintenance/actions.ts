"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getProperties() {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from("properties").select("id, name, property_type").order("name")

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  return data || []
}

export async function getUnits(propertyId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("units")
    .select("id, unit_number")
    .eq("property_id", propertyId)
    .order("unit_number")

  if (error) {
    throw new Error("Failed to fetch units")
  }

  return data || []
}

export async function getTenants(unitId: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("tenants")
    .select("id, first_name, last_name")
    .eq("unit_id", unitId)
    .eq("status", "active")

  if (error) {
    throw new Error("Failed to fetch tenants")
  }

  return data || []
}

export async function createMaintenanceRequest(formData: FormData) {
  const supabase = getServiceClient()

  const propertyId = formData.get("property_id") as string
  const unitId = (formData.get("unit_id") as string) || null
  const tenantId = (formData.get("tenant_id") as string) || null
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const priority = formData.get("priority") as string
  const estimatedCost = formData.get("estimated_cost") as string
  const currency = formData.get("currency") as string
  const deductionMonth = formData.get("deduction_month") as string // capture deduction_month from form
  const status = "pending"

  const requestData = {
    property_id: propertyId,
    unit_id: unitId === "none" ? null : unitId,
    tenant_id: tenantId === "none" ? null : tenantId,
    title,
    description,
    priority,
    status,
    estimated_cost: estimatedCost ? Number.parseFloat(estimatedCost) : null,
    currency: currency || "UGX",
    approved: false,
    deduction_month: deductionMonth || new Date().toISOString().substring(0, 7), // save deduction_month
  }

  const { data: maintenanceRequest, error } = await supabase
    .from("maintenance_requests")
    .insert([requestData])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (estimatedCost && Number.parseFloat(estimatedCost) > 0) {
    const expenseData = {
      property_id: propertyId,
      amount: Number.parseFloat(estimatedCost),
      type: "expense",
      transaction_date: new Date().toISOString().split("T")[0],
      description: `Pending: ${title} (Maintenance Request #${maintenanceRequest.id.slice(0, 8)})`,
    }

    const { error: expenseError } = await supabase.from("transactions").insert([expenseData])

    if (expenseError) {
      console.error("Error creating pending expense:", expenseError)
    }
  }

  revalidatePath("/maintenance")
  revalidatePath("/expenses")
  return { success: true }
}

export async function updateMaintenanceRequest(id: string, formData: FormData) {
  const supabase = getServiceClient()

  const status = formData.get("status") as string
  const priority = formData.get("priority") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string

  const { error } = await supabase
    .from("maintenance_requests")
    .update({
      status,
      priority,
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating maintenance request:", error)
    throw new Error(error.message)
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function getMaintenanceRequest(id: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from("maintenance_requests").select("*").eq("id", id).single()

  if (error) {
    console.error("[v0] Error fetching maintenance request:", error)
    throw new Error("Failed to fetch maintenance request")
  }

  return data
}

export async function approveMaintenanceRequest(formData: FormData) {
  const supabase = getServiceClient()
  const requestId = formData.get("request_id") as string

  // Get the maintenance request details
  const { data: request, error: fetchError } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    throw new Error("Failed to fetch maintenance request")
  }

  const { error: updateError } = await supabase
    .from("maintenance_requests")
    .update({
      approved: true,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // If there's an estimated cost, create an approved expense
  if (request.estimated_cost && request.estimated_cost > 0) {
    const expenseData = {
      property_id: request.property_id,
      amount: request.estimated_cost,
      type: "expense",
      transaction_date: new Date().toISOString().split("T")[0],
      description: `Approved: ${request.title} (Maintenance #${request.id.slice(0, 8)})`,
    }

    const { error: expenseError } = await supabase.from("transactions").insert([expenseData])

    if (expenseError) {
      console.error("Error creating expense:", expenseError)
      throw new Error(`Error creating expense: ${expenseError.message}`)
    }
  }

  revalidatePath("/maintenance")
  revalidatePath("/expenses")
  return { success: true }
}

export async function rejectMaintenanceRequest(formData: FormData) {
  const supabase = getServiceClient()
  const requestId = formData.get("request_id") as string

  const { error } = await supabase
    .from("maintenance_requests")
    .update({
      approved: false,
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/maintenance")
  return { success: true }
}

export async function deleteMaintenanceRequest(requestId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("maintenance_requests").delete().eq("id", requestId)

  if (error) {
    console.error("[v0] Error deleting maintenance request:", error)
    throw new Error(error.message)
  }

  revalidatePath("/maintenance")
}
