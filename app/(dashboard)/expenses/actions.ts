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

export async function getBankAccounts() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, gl_account_id")
    .order("account_name", { ascending: true })

  if (error) {
    console.error(" Error fetching bank accounts:", error)
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
  // Based on chart_of_accounts: 5010=Maintenance, 5020=Salaries, 5030=Utilities, 
  // 5040=Insurance, 5050=Commission, 5060=Administrative, 5070=Transportation, 5080=Office Rent
  const categoryToAccount: { [key: string]: string } = {
    maintenance: "5010", // Maintenance & Repairs
    salary: "5020", // Salaries & Wages
    wage: "5020", // Salaries & Wages (same as salary)
    utilities: "5030", // Utilities Expense
    internet: "5060", // Administrative Expense (communications)
    cleaning: "5010", // Maintenance & Repairs
    field_expense: "5070", // Transportation Expense
    transport: "5070", // Transportation Expense
    office_rent: "5080", // Office Rent Expense
    other: "5060", // Administrative Expense (fallback)
  }

  const expenseAccountCode = categoryToAccount[category] || "5060" // Default to Administrative Expense

  const { data: expenseAccounts, error: accountError } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("account_code", expenseAccountCode)
    .eq("is_active", true)
    .single()

  if (accountError || !expenseAccounts) {
    log.error("Expense GL account not found", {
      accountCode: expenseAccountCode,
      category,
      error: accountError,
    })
    throw new Error(
      `Expense GL account ${expenseAccountCode} not found. Please ensure the chart of accounts is properly set up.`
    )
  }

  log.debug("Found expense GL account", {
    accountCode: expenseAccountCode,
    accountName: expenseAccounts.account_name,
    accountId: expenseAccounts.id,
  })

  const glEntries = [
    {
      account_id: expenseAccounts.id,
      debit: amount,
      credit: 0,
      transaction_date: transactionDate,
      description: `Expense: ${description}`,
      reference_type: "expense",
      reference_id: expenseId,
    },
    {
      account_id: bankAccount.gl_account_id,
      debit: 0,
      credit: amount,
      transaction_date: transactionDate,
      description: `Expense payment: ${description}`,
      reference_type: "expense",
      reference_id: expenseId,
    },
  ]

  const { error } = await supabase.from("general_ledger").insert(glEntries)

  if (error) {
    console.error(" Error posting expense to GL:", error)
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

  log.debug("Creating expense", { category, amount, currency })

  const { data, error } = await supabase.from("transactions").insert([expenseData]).select()

  if (error) {
    log.error("Error creating expense", error)
    throw new Error(error.message)
  }

  log.info("Expense created successfully", { expenseId: data?.[0]?.id })

  if (data && data.length > 0) {
    const expenseId = data[0].id
    try {
      await recordExpenseToGL(expenseId, category, amount, description, transactionDate, bankAccountId)
      console.log(" Expense posted to GL successfully")
    } catch (glError) {
      console.error(" Failed to post expense to GL:", glError)
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
