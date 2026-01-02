"use server"

import { createServerClient } from "@supabase/ssr"
import { revalidatePath } from "next/cache"

function getServiceClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export async function getExpenseCategories() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("is_active", true)
    .order("category_name")

  if (error) {
    console.error("[v0] Error fetching expense categories:", error)
    throw new Error("Failed to fetch expense categories")
  }

  return data || []
}

export async function createExpenseCategory(
  categoryName: string,
  description?: string,
  glAccountId?: string,
  budgetLimit?: number,
) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      category_name: categoryName,
      description,
      gl_account_id: glAccountId,
      budget_limit: budgetLimit,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating expense category:", error)
    throw new Error("Failed to create expense category")
  }

  revalidatePath("/accounting/expenses")
  return data
}

export async function recordExpense(expenseData: {
  categoryId: string
  amount: number
  description: string
  expenseDate: string
  propertyId?: string
  vendor?: string
  paymentMethod?: string
  referenceNumber?: string
  attachmentUrl?: string
}) {
  const supabase = getServiceClient()

  const { data: category } = await supabase
    .from("expense_categories")
    .select("gl_account_id")
    .eq("id", expenseData.categoryId)
    .single()

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      category_id: expenseData.categoryId,
      amount: expenseData.amount,
      description: expenseData.description,
      expense_date: expenseData.expenseDate,
      property_id: expenseData.propertyId,
      vendor: expenseData.vendor,
      payment_method: expenseData.paymentMethod,
      reference_number: expenseData.referenceNumber,
      attachment_url: expenseData.attachmentUrl,
      status: "recorded",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error recording expense:", error)
    throw new Error("Failed to record expense")
  }

  // Post to GL
  if (category?.gl_account_id) {
    await supabase.from("general_ledger").insert({
      account_id: category.gl_account_id,
      transaction_date: expenseData.expenseDate,
      debit: expenseData.amount,
      credit: 0,
      description: `Expense: ${expenseData.description}`,
      reference_id: expense.id,
      reference_type: "expense",
    })
  }

  revalidatePath("/accounting/expenses")
  return expense
}

export async function getExpenses(categoryId?: string, startDate?: string, endDate?: string, propertyId?: string) {
  const supabase = getServiceClient()

  let query = supabase.from("expenses").select("*, category:category_id(category_name, gl_account_id)")

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  if (propertyId) {
    query = query.eq("property_id", propertyId)
  }

  if (startDate) {
    query = query.gte("expense_date", startDate)
  }

  if (endDate) {
    query = query.lte("expense_date", endDate)
  }

  const { data, error } = await query.order("expense_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching expenses:", error)
    throw new Error("Failed to fetch expenses")
  }

  return data || []
}

export async function getExpenseReport(startDate: string, endDate: string, propertyId?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from("expenses")
    .select("amount, category:category_id(category_name, budget_limit)")
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)

  if (propertyId) {
    query = query.eq("property_id", propertyId)
  }

  const { data: expenses, error } = await query

  if (error) {
    console.error("[v0] Error fetching expense report:", error)
    throw new Error("Failed to fetch expense report")
  }

  // Group by category
  const expensesByCategory: Record<string, { total: number; budget: number; variance: number }> = {}

  for (const expense of expenses || []) {
    const categoryName = expense.category?.category_name || "Uncategorized"

    if (!expensesByCategory[categoryName]) {
      expensesByCategory[categoryName] = {
        total: 0,
        budget: expense.category?.budget_limit || 0,
        variance: 0,
      }
    }

    expensesByCategory[categoryName].total += expense.amount
    expensesByCategory[categoryName].variance =
      expensesByCategory[categoryName].budget - expensesByCategory[categoryName].total
  }

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.total, 0)

  return {
    period: { startDate, endDate },
    expensesByCategory,
    totalExpenses,
  }
}

export async function getCategoryBudgetStatus(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  const { data: categories } = await supabase
    .from("expense_categories")
    .select("id, category_name, budget_limit")
    .eq("is_active", true)

  const budgetStatus = []

  for (const category of categories || []) {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("category_id", category.id)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)

    const totalSpent = (expenses || []).reduce((sum, e) => sum + e.amount, 0)
    const budgetLimit = category.budget_limit || 0
    const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0
    const status = percentageUsed > 100 ? "over_budget" : percentageUsed > 80 ? "warning" : "ok"

    budgetStatus.push({
      categoryId: category.id,
      categoryName: category.category_name,
      budgetLimit,
      totalSpent,
      remaining: budgetLimit - totalSpent,
      percentageUsed,
      status,
    })
  }

  return budgetStatus
}

export async function getMonthlyExpenseTrend(propertyId?: string) {
  const supabase = getServiceClient()

  const lastYear = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split("T")[0]

  let query = supabase
    .from("expenses")
    .select("amount, expense_date")
    .gte("expense_date", lastYear)
    .order("expense_date")

  if (propertyId) {
    query = query.eq("property_id", propertyId)
  }

  const { data: expenses, error } = await query

  if (error) {
    console.error("[v0] Error fetching expense trend:", error)
    throw new Error("Failed to fetch expense trend")
  }

  // Group by month
  const monthlyTotals: Record<string, number> = {}

  for (const expense of expenses || []) {
    const monthKey = expense.expense_date.substring(0, 7) // YYYY-MM format
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount
  }

  return Object.entries(monthlyTotals).map(([month, total]) => ({ month, total }))
}

export async function approveExpense(expenseId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("expenses").update({ status: "approved" }).eq("id", expenseId)

  if (error) {
    console.error("[v0] Error approving expense:", error)
    throw new Error("Failed to approve expense")
  }

  revalidatePath("/accounting/expenses")
}

export async function rejectExpense(expenseId: string, reason?: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("expenses").update({ status: "rejected", notes: reason }).eq("id", expenseId)

  if (error) {
    console.error("[v0] Error rejecting expense:", error)
    throw new Error("Failed to reject expense")
  }

  revalidatePath("/accounting/expenses")
}

export async function getExpenseSummary(startDate: string, endDate: string, propertyId?: string) {
  const report = await getExpenseReport(startDate, endDate, propertyId)
  const budgetStatus = await getCategoryBudgetStatus(startDate, endDate)
  const monthlyTrend = await getMonthlyExpenseTrend(propertyId)

  return {
    totalExpenses: report.totalExpenses,
    expensesByCategory: report.expensesByCategory,
    budgetStatus,
    monthlyTrend,
    period: { startDate, endDate },
  }
}
