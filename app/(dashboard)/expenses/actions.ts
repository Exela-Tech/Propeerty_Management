"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

const log = logger.child("expenses:actions")

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
    log.error("Error fetching properties", error)
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

  log.debug("Creating expense", { category, amount, currency })

  const { data, error } = await supabase.from("transactions").insert([expenseData]).select()

  if (error) {
    log.error("Error creating expense", error)
    throw new Error(error.message)
  }

  log.info("Expense created successfully", { expenseId: data?.[0]?.id })

  revalidatePath("/expenses")
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("transactions").delete().eq("id", expenseId)

  if (error) {
    log.error("Error deleting expense", error, { expenseId })
    throw new Error(error.message)
  }

  log.info("Expense deleted successfully", { expenseId })
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
    log.error("Error updating expense", error, { expenseId })
    throw new Error(error.message)
  }

  log.info("Expense updated successfully", { expenseId })
  revalidatePath("/expenses")
}
