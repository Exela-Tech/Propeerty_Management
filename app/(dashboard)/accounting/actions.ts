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

// Bank Accounts
export async function getBankAccounts() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, gl_account_id, currency, current_balance")
    .order("account_name", { ascending: true })

  if (error) {
    console.error("Error fetching bank accounts:", error)
    return []
  }

  return data || []
}

export async function createBankAccount(accountData: {
  account_name: string
  bank_name: string
  account_number: string
  gl_account_id: string
  currency: string
  account_type: string
}) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from("bank_accounts").insert(accountData).select().single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/accounting/bank-management")
  return data
}

export async function updateBankAccount(id: string, accountData: Partial<typeof createBankAccount extends (data: infer T) => any ? T : never>) {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from("bank_accounts").update(accountData).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/accounting/bank-management")
  return data
}

export async function getBankTransactions(bankAccountId: string, startDate?: string, endDate?: string) {
  const supabase = getServiceClient()
  let query = supabase
    .from("general_ledger")
    .select(
      `
      *,
      chart_of_accounts (
        account_code,
        account_name
      )
    `,
    )
    .eq("account_id", bankAccountId)
    .order("transaction_date", { ascending: false })

  if (startDate) {
    query = query.gte("transaction_date", startDate)
  }
  if (endDate) {
    query = query.lte("transaction_date", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching bank transactions:", error)
    return []
  }

  return data || []
}

export async function getChartOfAccountsForBanks() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("account_type", "asset")
    .eq("account_subtype", "current_asset")
    .order("account_code", { ascending: true })

  if (error) {
    console.error("Error fetching chart of accounts:", error)
    return []
  }

  return data || []
}

// Chart of Accounts
export async function getChartOfAccounts() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .order("account_code", { ascending: true })

  if (error) {
    console.error("Error fetching chart of accounts:", error)
    return {
      asset: [],
      liability: [],
      equity: [],
      income: [],
      expense: [],
    }
  }

  const accounts = data || []
  return {
    asset: accounts.filter((acc) => acc.account_type === "asset"),
    liability: accounts.filter((acc) => acc.account_type === "liability"),
    equity: accounts.filter((acc) => acc.account_type === "equity"),
    income: accounts.filter((acc) => acc.account_type === "income"),
    expense: accounts.filter((acc) => acc.account_type === "expense"),
  }
}

export async function getAccountBalances() {
  const supabase = getServiceClient()

  // Get all accounts
  const { data: accounts, error: accountsError } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, normal_balance")
    .order("account_code", { ascending: true })

  if (accountsError) {
    console.error("Error fetching accounts:", accountsError)
    return []
  }

  // Calculate balances for each account
  const balances = await Promise.all(
    (accounts || []).map(async (account) => {
      const { data: glEntries, error: glError } = await supabase
        .from("general_ledger")
        .select("debit, credit")
        .eq("account_id", account.id)
        .eq("status", "POSTED")

      if (glError) {
        console.error(`Error fetching GL entries for account ${account.id}:`, glError)
        return {
          id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          normal_balance: account.normal_balance,
          current_balance: 0,
        }
      }

      const totalDebits = (glEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
      const totalCredits = (glEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

      let balance = 0
      if (account.normal_balance === "debit") {
        balance = totalDebits - totalCredits
      } else {
        balance = totalCredits - totalDebits
      }

      return {
        id: account.id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        normal_balance: account.normal_balance,
        current_balance: balance,
      }
    }),
  )

  return balances
}

// General Ledger
export async function getGeneralLedger(filters?: {
  accountId?: string
  startDate?: string
  endDate?: string
  periodMonth?: string
  periodYear?: string
}) {
  const supabase = getServiceClient()
  let query = supabase
    .from("general_ledger")
    .select(
      `
      *,
      chart_of_accounts (
        account_code,
        account_name,
        account_type,
        normal_balance
      ),
      journal_entries (
        journal_number,
        journal_type,
        description
      )
    `,
    )
    .eq("status", "POSTED")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId)
  }
  if (filters?.startDate) {
    query = query.gte("transaction_date", filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte("transaction_date", filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching general ledger:", error)
    return []
  }

  return data || []
}

// Dashboard
export async function getAccountingDashboard() {
  const supabase = getServiceClient()

  // Get income accounts
  const { data: incomeAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_type", "income")

  const incomeAccountIds = (incomeAccounts || []).map((acc) => acc.id)

  // Get expense accounts
  const { data: expenseAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_type", "expense")

  const expenseAccountIds = (expenseAccounts || []).map((acc) => acc.id)

  // Get trust account
  const { data: trustAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "1010")
    .single()

  // Calculate totals
  const { data: incomeEntries } = await supabase
    .from("general_ledger")
    .select("credit")
    .in("account_id", incomeAccountIds)
    .eq("status", "POSTED")

  const { data: expenseEntries } = await supabase
    .from("general_ledger")
    .select("debit")
    .in("account_id", expenseAccountIds)
    .eq("status", "POSTED")

  const { data: trustEntries } = await supabase
    .from("general_ledger")
    .select("debit, credit")
    .eq("account_id", trustAccount?.id)
    .eq("status", "POSTED")

  const totalIncome = (incomeEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)
  const totalExpenses = (expenseEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
  const netProfit = totalIncome - totalExpenses

  const trustBalance =
    (trustEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0) -
    (trustEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

  // Get monthly data for charts
  const { data: monthlyData } = await supabase
    .from("general_ledger")
    .select("transaction_date, debit, credit, account_id, chart_of_accounts!inner(account_type)")
    .eq("status", "POSTED")
    .order("transaction_date", { ascending: true })

  const chartData: Array<{ month: string; income: number; expenses: number }> = []
  const expensesByCategory: Array<{ category: string; amount: number }> = []

  return {
    metrics: {
      totalIncome,
      totalExpenses,
      netProfit,
      trustBalance,
    },
    chartData,
    expensesByCategory,
  }
}

// Financial Reports
export async function getBalanceSheet(asOfDate: string) {
  const supabase = getServiceClient()

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, normal_balance")
    .order("account_code", { ascending: true })

  const balances = await Promise.all(
    (accounts || []).map(async (account) => {
      const { data: glEntries } = await supabase
        .from("general_ledger")
        .select("debit, credit")
        .eq("account_id", account.id)
        .eq("status", "POSTED")
        .lte("transaction_date", asOfDate)

      const totalDebits = (glEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
      const totalCredits = (glEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

      let balance = 0
      if (account.normal_balance === "debit") {
        balance = totalDebits - totalCredits
      } else {
        balance = totalCredits - totalDebits
      }

      return {
        ...account,
        balance,
      }
    }),
  )

  const assets = balances.filter((acc) => acc.account_type === "asset")
  const liabilities = balances.filter((acc) => acc.account_type === "liability")
  const equity = balances.filter((acc) => acc.account_type === "equity")

  const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0)
  const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0)

  return {
    asOfDate,
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  }
}

export async function getCashFlowStatement(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  // This is a simplified implementation
  // A full cash flow statement would categorize transactions into operating, investing, and financing activities

  const { data: transactions } = await supabase
    .from("general_ledger")
    .select(
      `
      *,
      chart_of_accounts!inner (
        account_type,
        account_subtype
      )
    `,
    )
    .eq("status", "POSTED")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: true })

  return {
    startDate,
    endDate,
    transactions: transactions || [],
  }
}

export async function getProfitAndLossStatement(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  const { data: incomeAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("account_type", "income")

  const { data: expenseAccounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("account_type", "expense")

  const incomeAccountIds = (incomeAccounts || []).map((acc) => acc.id)
  const expenseAccountIds = (expenseAccounts || []).map((acc) => acc.id)

  const { data: incomeEntries } = await supabase
    .from("general_ledger")
    .select("credit, transaction_date, chart_of_accounts!inner(account_code, account_name)")
    .in("account_id", incomeAccountIds)
    .eq("status", "POSTED")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)

  const { data: expenseEntries } = await supabase
    .from("general_ledger")
    .select("debit, transaction_date, chart_of_accounts!inner(account_code, account_name)")
    .in("account_id", expenseAccountIds)
    .eq("status", "POSTED")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)

  const totalIncome = (incomeEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)
  const totalExpenses = (expenseEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
  const netProfit = totalIncome - totalExpenses

  return {
    startDate,
    endDate,
    income: incomeEntries || [],
    expenses: expenseEntries || [],
    totalIncome,
    totalExpenses,
    netProfit,
  }
}

// Landlord Statements
export async function getLandlordStatements() {
  const supabase = getServiceClient()

  const { data: landlords, error } = await supabase.from("landlords").select("id, name, email").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching landlords:", error)
    return []
  }

  // For each landlord, calculate their statement
  const statements = await Promise.all(
    (landlords || []).map(async (landlord) => {
      // This is a simplified version - you'd need to calculate rent collected, expenses, fees, etc.
      return {
        landlord_id: landlord.id,
        landlord_name: landlord.name,
        landlord_email: landlord.email,
        total_collected: 0,
        total_expenses: 0,
        total_fees: 0,
        balance: 0,
      }
    }),
  )

  return statements
}

export async function getLandlordSubledger(landlordId: string) {
  const supabase = getServiceClient()

  // Get all transactions related to this landlord
  const { data: transactions, error } = await supabase
    .from("general_ledger")
    .select(
      `
      *,
      chart_of_accounts (
        account_code,
        account_name
      )
    `,
    )
    .eq("reference_type", "landlord_payment")
    .eq("reference_id", landlordId)
    .eq("status", "POSTED")
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("Error fetching landlord subledger:", error)
    return []
  }

  return transactions || []
}

// Bank Reconciliation
export async function getBankReconciliation(bankAccountId: string, asOfDate: string) {
  const supabase = getServiceClient()

  // Get bank account GL account ID
  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("gl_account_id, current_balance")
    .eq("id", bankAccountId)
    .single()

  if (!bankAccount?.gl_account_id) {
    return {
      bankAccountId,
      asOfDate,
      glBalance: 0,
      bankBalance: bankAccount?.current_balance || 0,
      difference: 0,
      outstandingItems: [],
    }
  }

  // Get GL balance for the bank account
  const { data: glEntries } = await supabase
    .from("general_ledger")
    .select("debit, credit")
    .eq("account_id", bankAccount.gl_account_id)
    .eq("status", "POSTED")
    .lte("transaction_date", asOfDate)

  const glBalance =
    (glEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0) -
    (glEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

  const bankBalance = bankAccount.current_balance || 0
  const difference = bankBalance - glBalance

  // Get outstanding items (deposits in transit, outstanding checks, etc.)
  // This would need additional logic to identify unreconciled items

  return {
    bankAccountId,
    asOfDate,
    glBalance,
    bankBalance,
    difference,
    outstandingItems: [],
  }
}

export async function getBankReconciliationSummary() {
  const supabase = getServiceClient()

  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, current_balance, gl_account_id")
    .order("account_name", { ascending: true })

  return {
    accounts: bankAccounts || [],
  }
}

export async function getAccountReconciliationSummary() {
  const supabase = getServiceClient()

  const { data: accounts } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .order("account_code", { ascending: true })

  return {
    accounts: accounts || [],
  }
}

export async function getAccountReconciliation(accountId: string, asOfDate: string) {
  const supabase = getServiceClient()

  // Get account details
  const { data: account } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type, normal_balance")
    .eq("id", accountId)
    .single()

  if (!account) {
    throw new Error("Account not found")
  }

  // Get GL entries
  const { data: glEntries } = await supabase
    .from("general_ledger")
    .select("debit, credit, transaction_date, description, reference_type, reference_id")
    .eq("account_id", accountId)
    .eq("status", "POSTED")
    .lte("transaction_date", asOfDate)
    .order("transaction_date", { ascending: false })

  const totalDebits = (glEntries || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
  const totalCredits = (glEntries || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

  let balance = 0
  if (account.normal_balance === "debit") {
    balance = totalDebits - totalCredits
  } else {
    balance = totalCredits - totalDebits
  }

  return {
    accountId,
    accountName: account.account_name,
    accountCode: account.account_code,
    asOfDate,
    totalDebits,
    totalCredits,
    balance,
    entries: glEntries || [],
    isReconciled: Math.abs(totalDebits - totalCredits) < 0.01,
  }
}
