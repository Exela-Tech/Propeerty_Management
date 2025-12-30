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
    console.error("[v0] Error fetching properties:", error)
    throw new Error("Failed to fetch properties")
  }

  return data || []
}

export async function createExpense(formData: FormData) {
  const supabase = getServiceClient()

  const propertyId = formData.get("property_id") as string
  const category = formData.get("category") as string
  const transactionDate = formData.get("transaction_date") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const currency = formData.get("currency") as string
  const description = formData.get("description") as string

  const expenseData = {
    property_id: !propertyId || propertyId === "none" ? null : propertyId,
    category,
    transaction_date: transactionDate,
    amount,
    currency,
    description,
    type: "expense",
  }

  console.log("[v0] Creating expense with data:", expenseData)

  const { data, error } = await supabase.from("transactions").insert([expenseData]).select()

  if (error) {
    console.error("[v0] Error creating expense:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Expense created successfully:", data)

  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("transactions").delete().eq("id", expenseId)

  if (error) {
    console.error("[v0] Error deleting expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/expenses")
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const supabase = getServiceClient()

  const propertyId = formData.get("property_id") as string
  const category = formData.get("category") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const currency = formData.get("currency") as string
  const description = formData.get("description") as string

  const { error } = await supabase
    .from("transactions")
    .update({
      property_id: !propertyId || propertyId === "none" ? null : propertyId,
      category,
      amount,
      currency,
      description,
    })
    .eq("id", expenseId)

  if (error) {
    console.error("[v0] Error updating expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/expenses")
}
