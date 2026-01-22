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
    console.error("Error fetching properties:", error)
    throw new Error("Failed to fetch properties")
  }

  return data || []
}

export async function getBankAccounts() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, gl_account_id")
    .order("account_name", { ascending: true })

  if (error) {
    console.error("Error fetching bank accounts:", error)
    return []
  }

  return data || []
}

async function recordExpenseToGL(
  expenseId: string,
  category: string,
  amount: number,
  description: string,
  transactionDate: string,
  bankAccountId: string, // Added bank account ID parameter
) {
  const supabase = getServiceClient()

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("gl_account_id")
    .eq("id", bankAccountId)
    .single()

  if (!bankAccount?.gl_account_id) {
    throw new Error("Bank account GL link not found")
  }

  // Map expense category to GL account
  const categoryToAccount: { [key: string]: string } = {
    salary: "5010",
    transport: "5020",
    wage: "5030",
    internet: "5040",
    field_expense: "5050",
    office_rent: "5060",
    utilities: "5070",
    cleaning: "5080",
    maintenance: "5090",
    other: "5099",
  }

  const expenseAccountCode = categoryToAccount[category] || "5099"

  const { data: expenseAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code")
    .eq("account_code", expenseAccountCode)
    .single()

  if (!expenseAccounts) {
    throw new Error(`Expense GL account ${expenseAccountCode} not found`)
  }

  const glEntries = [
    {
      account_id: expenseAccounts.id,
      debit: amount,
      credit: 0,
      transaction_date: transactionDate,
      description: description,
      reference_type: "expense",
      reference_id: expenseId,
    },
    {
      account_id: bankAccount.gl_account_id,
      debit: 0,
      credit: amount,
      transaction_date: transactionDate,
      description: description,
      reference_type: "expense",
      reference_id: expenseId,
    },
  ]

  const { error } = await supabase.from("general_ledger").insert(glEntries)

  if (error) {
    console.error("Error posting expense to GL:", error)
    throw new Error("Failed to post expense to general ledger")
  }
}

export async function createExpense(formData: FormData) {
  const supabase = getServiceClient()

  const propertyId = formData.get("property_id") as string
  const category = formData.get("category") as string
  const transactionDate = formData.get("transaction_date") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const currency = formData.get("currency") as string
  const description = formData.get("description") as string
  const bankAccountId = formData.get("bank_account_id") as string // Get selected bank

  if (!bankAccountId) {
    throw new Error("Please select a bank account")
  }

  const expenseData = {
    property_id: !propertyId || propertyId === "none" ? null : propertyId,
    category,
    transaction_date: transactionDate,
    amount,
    currency,
    description,
    type: "expense",
  }

  console.log("Creating expense with data:", expenseData)

  const { data, error } = await supabase.from("transactions").insert([expenseData]).select()

  if (error) {
    console.error("Error creating expense:", error)
    throw new Error(error.message)
  }

  console.log("Expense created successfully:", data)

  if (data && data.length > 0) {
    const expenseId = data[0].id
    try {
      await recordExpenseToGL(expenseId, category, amount, description, transactionDate, bankAccountId)
      console.log("Expense posted to GL successfully")
    } catch (glError) {
      console.error("Failed to post expense to GL:", glError)
      // Rollback the expense
      await supabase.from("transactions").delete().eq("id", expenseId)
      throw glError
    }
  }

  revalidatePath("/expenses")
  revalidatePath("/accounting/financial-reports/profit-loss")
  revalidatePath("/accounting/cash-management")
  revalidatePath("/accounting/bank-management")
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("transactions").delete().eq("id", expenseId)

  if (error) {
    console.error("Error deleting expense:", error)
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
    console.error("Error updating expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/expenses")
}
