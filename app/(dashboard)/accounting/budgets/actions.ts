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

export async function createBudget(budgetData: {
  budgetName: string
  budgetYear: number
  budgetMonth?: number
  propertyId?: string
  description?: string
}) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      budget_name: budgetData.budgetName,
      budget_year: budgetData.budgetYear,
      budget_month: budgetData.budgetMonth,
      property_id: budgetData.propertyId,
      description: budgetData.description,
      status: "draft",
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single()

  if (error) {
    console.error(" Error creating budget:", error)
    throw new Error("Failed to create budget")
  }

  revalidatePath("/accounting/budgets")
  return data
}

export async function addBudgetLineItem(budgetId: string, categoryId: string, budgetedAmount: number, notes?: string) {
  const supabase = getServiceClient()

  const { data: category } = await supabase
    .from("expense_categories")
    .select("gl_account_id")
    .eq("id", categoryId)
    .single()

  const { data, error } = await supabase
    .from("budget_line_items")
    .insert({
      budget_id: budgetId,
      account_id: category?.gl_account_id,
      category_id: categoryId,
      budgeted_amount: budgetedAmount,
      notes,
    })
    .select()
    .single()

  if (error) {
    console.error(" Error adding budget line item:", error)
    throw new Error("Failed to add budget line item")
  }

  revalidatePath("/accounting/budgets")
  return data
}

export async function getBudgets(year: number, propertyId?: string) {
  const supabase = getServiceClient()

  let query = supabase.from("budgets").select("*, budget_line_items(*)").eq("budget_year", year)

  if (propertyId) {
    query = query.eq("property_id", propertyId)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching budgets:", error)
    throw new Error("Failed to fetch budgets")
  }

  return data || []
}

export async function getBudgetDetails(budgetId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("budgets")
    .select("*, budget_line_items(*, category:category_id(category_name, id))")
    .eq("id", budgetId)
    .single()

  if (error) {
    console.error(" Error fetching budget details:", error)
    throw new Error("Failed to fetch budget details")
  }

  return data
}

export async function calculateVariance(budgetId: string) {
  const supabase = getServiceClient()

  const { data: budget } = await supabase
    .from("budgets")
    .select("budget_year, budget_month, budget_line_items(*)")
    .eq("id", budgetId)
    .single()

  if (!budget) {
    throw new Error("Budget not found")
  }

  const startDate = `${budget.budget_year}-${budget.budget_month || "01"}-01`
  const endDate = budget.budget_month
    ? new Date(budget.budget_year, budget.budget_month, 0).toISOString().split("T")[0]
    : `${budget.budget_year}-12-31`

  // Calculate actual spending for each line item
  const variances = []

  for (const lineItem of budget.budget_line_items) {
    const { data: actualExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("category_id", lineItem.category_id)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)

    const actualAmount = (actualExpenses || []).reduce((sum, e) => sum + e.amount, 0)
    const variance = lineItem.budgeted_amount - actualAmount
    const variancePercentage = (variance / lineItem.budgeted_amount) * 100
    const varianceType = variance >= 0 ? "favorable" : "unfavorable"

    variances.push({
      lineItemId: lineItem.id,
      budgetedAmount: lineItem.budgeted_amount,
      actualAmount,
      variance,
      variancePercentage,
      varianceType,
    })

    // Record variance
    await supabase.from("budget_variances").insert({
      budget_id: budgetId,
      line_item_id: lineItem.id,
      actual_amount: actualAmount,
      variance_amount: variance,
      variance_percentage: variancePercentage,
      variance_type: varianceType,
    })
  }

  return variances
}

export async function getVarianceAnalysis(budgetId: string) {
  const supabase = getServiceClient()

  const { data: variances, error } = await supabase
    .from("budget_variances")
    .select("*, line_item:line_item_id(category:category_id(category_name))")
    .eq("budget_id", budgetId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(" Error fetching variance analysis:", error)
    throw new Error("Failed to fetch variance analysis")
  }

  const summary = {
    totalBudgeted: 0,
    totalActual: 0,
    totalVariance: 0,
    favorableCount: 0,
    unfavorableCount: 0,
  }

  for (const variance of variances || []) {
    summary.totalBudgeted += variance.line_item?.budgeted_amount || 0
    summary.totalActual += variance.actual_amount || 0
    summary.totalVariance += variance.variance_amount || 0
    if (variance.variance_type === "favorable") summary.favorableCount++
    else summary.unfavorableCount++
  }

  return {
    variances: variances || [],
    summary,
  }
}

export async function approveBudget(budgetId: string) {
  const supabase = getServiceClient()

  const userId = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from("budgets")
    .update({ status: "approved", approved_by: userId })
    .eq("id", budgetId)

  if (error) {
    console.error(" Error approving budget:", error)
    throw new Error("Failed to approve budget")
  }

  revalidatePath("/accounting/budgets")
}

export async function activateBudget(budgetId: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("budgets").update({ status: "active" }).eq("id", budgetId)

  if (error) {
    console.error(" Error activating budget:", error)
    throw new Error("Failed to activate budget")
  }

  revalidatePath("/accounting/budgets")
}

export async function getBudgetComparison(year: number, propertyId?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from("budgets")
    .select("budget_month, budget_line_items(budgeted_amount)")
    .eq("budget_year", year)

  if (propertyId) {
    query = query.eq("property_id", propertyId)
  }

  const { data: budgets, error } = await query

  if (error) {
    console.error(" Error fetching budget comparison:", error)
    throw new Error("Failed to fetch budget comparison")
  }

  // Compare budgeted vs actual across months
  const comparison: Record<string, { budgeted: number; actual: number }> = {}

  for (const budget of budgets || []) {
    const month = budget.budget_month || 1
    const monthKey = `Month ${month}`

    const budgeted = (budget.budget_line_items || []).reduce((sum: number, li: any) => sum + li.budgeted_amount, 0)

    if (!comparison[monthKey]) {
      comparison[monthKey] = { budgeted: 0, actual: 0 }
    }
    comparison[monthKey].budgeted += budgeted
  }

  return comparison
}

export async function getVarianceReport(year: number, propertyId?: string) {
  const supabase = getServiceClient()

  const query = supabase
    .from("budget_variances")
    .select("variance_type, variance_amount, budget:budget_id(budget_month)")

  const { data: variances, error } = await query

  if (error) {
    console.error(" Error fetching variance report:", error)
    throw new Error("Failed to fetch variance report")
  }

  const report = {
    totalFavorableVariance: 0,
    totalUnfavorableVariance: 0,
    varianceByType: {} as Record<string, number>,
  }

  for (const variance of variances || []) {
    if (variance.variance_type === "favorable") {
      report.totalFavorableVariance += variance.variance_amount || 0
    } else {
      report.totalUnfavorableVariance += variance.variance_amount || 0
    }

    if (!report.varianceByType[variance.variance_type]) {
      report.varianceByType[variance.variance_type] = 0
    }
    report.varianceByType[variance.variance_type] += variance.variance_amount || 0
  }

  return report
}
