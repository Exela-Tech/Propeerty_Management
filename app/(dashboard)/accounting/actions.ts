"use server"

import { getServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getChartOfAccounts() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("is_active", true)
    .order("account_code")

  if (error) {
    console.error("Error fetching chart of accounts:", error)
    throw new Error("Failed to fetch chart of accounts")
  }

  const grouped = {
    asset: data.filter((a) => a.account_type === "asset"),
    liability: data.filter((a) => a.account_type === "liability"),
    equity: data.filter((a) => a.account_type === "equity"),
    income: data.filter((a) => a.account_type === "income"),
    expense: data.filter((a) => a.account_type === "expense"),
  }

  return grouped
}

export async function getAccountBalances() {
  const supabase = getServiceClient()

  const { data, error } = await supabase.from("account_balances").select("*").order("account_code")

  if (error) {
    console.error("Error fetching account balances:", error)
    throw new Error("Failed to fetch account balances")
  }

  return data || []
}

export async function getGeneralLedger(accountId?: string, startDate?: string, endDate?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from("general_ledger")
    .select("*, account:account_id(account_code, account_name)")
    .order("transaction_date", { ascending: false })

  if (accountId) {
    query = query.eq("account_id", accountId)
  }

  if (startDate) {
    query = query.gte("transaction_date", startDate)
  }

  if (endDate) {
    query = query.lte("transaction_date", endDate)
  }

  const { data, error } = await query.limit(500)

  if (error) {
    console.error("Error fetching general ledger:", error)
    throw new Error("Failed to fetch general ledger")
  }

  return data || []
}

export async function syncTenantPaymentToGL(paymentId: string) {
  const supabase = getServiceClient()

  const { data: payment } = await supabase
    .from("tenant_payments")
    .select("*, tenant:tenant_id(first_name, last_name, property_id, unit_id)")
    .eq("id", paymentId)
    .single()

  if (!payment) {
    throw new Error("Payment not found")
  }

  const { data: undepositedAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "1015")
    .single()

  const { data: rentTrustAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "2010")
    .single()

  if (!undepositedAccount || !rentTrustAccount) {
    throw new Error("Required trust accounts not found")
  }

  // Build descriptive payment description with tenant name
  const tenantName = payment.tenant ? `${payment.tenant.first_name} ${payment.tenant.last_name}` : "Unknown Tenant"
  const paymentDescription = `Tenant payment received - ${tenantName}`

  const entries = [
    {
      account_id: undepositedAccount.id,
      transaction_date: payment.payment_date,
      reference_id: payment.id,
      reference_type: "tenant_payment",
      description: paymentDescription,
      debit: payment.amount,
      credit: 0,
    },
    {
      account_id: rentTrustAccount.id,
      transaction_date: payment.payment_date,
      reference_id: payment.id,
      reference_type: "tenant_payment",
      description: paymentDescription,
      debit: 0,
      credit: payment.amount,
    },
  ]

  const { error } = await supabase.from("general_ledger").insert(entries)

  if (error) {
    console.error("Error syncing payment to GL:", error)
    throw new Error("Failed to sync payment to general ledger")
  }

  revalidatePath("/accounting")
  revalidatePath("/accounting/cash-management")
}

export async function getBankAccounts() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, account_name, bank_name, account_number, gl_account_id")
    .order("account_name", { ascending: true })

  if (error) {
    console.error("Error fetching bank accounts:", error)
    throw new Error("Failed to fetch bank accounts")
  }

  return data || []
}

export async function getUndepositedFunds() {
  const supabase = getServiceClient()

  const { data: tenantPayments } = await supabase
    .from("tenant_payments")
    .select("id, amount, payment_date, tenant:tenant_id(first_name, last_name)")
    .eq("is_deposited", false)
    .eq("status", "completed")
    .order("payment_date", { ascending: false })

  const { data: landlordPayments } = await supabase
    .from("landlord_payments")
    .select("id, amount, payment_date, landlord:landlord_id(name)")
    .eq("is_deposited", false)
    .eq("status", "completed")
    .order("payment_date", { ascending: false })

  const combinedPayments = [
    ...(tenantPayments || []).map((p: any) => ({
      ...p,
      type: "tenant_payment",
      payerName: `${p.tenant?.first_name} ${p.tenant?.last_name}`,
    })),
    ...(landlordPayments || []).map((p: any) => ({
      ...p,
      type: "landlord_payment",
      payerName: p.landlord?.name,
    })),
  ]

  return combinedPayments
}

export async function getPaymentDeposits(bankAccountId?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from("payment_deposits")
    .select(
      "*, bank_account:bank_account_id(account_name, bank_name), deposit_items(*, tenant:tenant_id(first_name, last_name))",
    )
    .order("deposit_date", { ascending: false })

  if (bankAccountId) {
    query = query.eq("bank_account_id", bankAccountId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching deposits:", error)
    throw new Error("Failed to fetch deposits")
  }

  return data || []
}

export async function createPaymentDeposit(
  bankAccountId: string,
  paymentIds: string[],
  depositDate: string,
  depositReference?: string,
  notes?: string,
) {
  const supabase = getServiceClient()

  console.log("Creating deposit for bank:", bankAccountId)
  console.log("Payment IDs:", paymentIds)

  const { data: tenantPayments, error: tenantError } = await supabase
    .from("tenant_payments")
    .select("id, amount, payment_date, tenant_id, tenants!inner(first_name, last_name)")
    .in("id", paymentIds)

  console.log("Tenant payments fetched:", tenantPayments)

  if (tenantError) {
    console.log("Error fetching tenant payments:", tenantError.message)
  }

  let landlordPaymentsWithNames: any[] = []

  const { data: landlordPayments, error: landlordError } = await supabase
    .from("landlord_payments")
    .select("id, amount, payment_date, landlord_id")
    .in("id", paymentIds)

  console.log("Landlord payments fetched:", landlordPayments)

  if (landlordError) {
    console.log("Error fetching landlord payments:", landlordError.message)
  }

  if (landlordPayments && landlordPayments.length > 0) {
    const landlordIds = landlordPayments.map((p) => p.landlord_id)

    const { data: landlordProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", landlordIds)

    if (profileError) {
      console.log("Error fetching landlord profiles:", profileError.message)
    } else if (landlordProfiles) {
      landlordPaymentsWithNames = landlordPayments.map((payment) => {
        const profile = landlordProfiles.find((p) => p.id === payment.landlord_id)
        return {
          ...payment,
          profiles: profile || null,
        }
      })
    }
  }

  const totalAmount =
    (tenantPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0) +
    (landlordPaymentsWithNames || []).reduce((sum, p) => sum + (p.amount || 0), 0)

  if (totalAmount === 0) {
    throw new Error("No valid payments found to deposit")
  }

  console.log("Total amount to deposit:", totalAmount)

  const payerNames: string[] = []

  if (tenantPayments && tenantPayments.length > 0) {
    tenantPayments.forEach((p: any) => {
      console.log("Processing tenant payment:", p)
      if (p.tenants) {
        payerNames.push(`Tenant payment received - ${p.tenants.first_name} ${p.tenants.last_name}`)
      }
    })
  }

  if (landlordPaymentsWithNames && landlordPaymentsWithNames.length > 0) {
    landlordPaymentsWithNames.forEach((p: any) => {
      console.log("Processing landlord payment:", p)
      if (p.profiles) {
        payerNames.push(`Landlord payment received - ${p.profiles.first_name} ${p.profiles.last_name}`)
      }
    })
  }

  console.log("Payer names collected:", payerNames)

  let depositDescription = ""
  if (payerNames.length > 0) {
    depositDescription = payerNames.join(", ")
  } else {
    depositDescription = "Bank deposit"
  }

  if (depositReference) {
    depositDescription += ` (Ref: ${depositReference})`
  }

  console.log("Final deposit description:", depositDescription)

  const { data: deposit, error: depositError } = await supabase
    .from("payment_deposits")
    .insert({
      bank_account_id: bankAccountId,
      total_amount: totalAmount,
      deposit_date: depositDate,
      deposit_reference: depositReference || "",
      notes: notes || "",
      status: "pending",
    })
    .select()
    .single()

  if (depositError) {
    console.error("Error creating deposit:", depositError)
    throw new Error("Failed to create deposit: " + depositError.message)
  }

  const depositItems = [
    ...(tenantPayments || []).map((p) => ({
      deposit_id: deposit.id,
      payment_id: p.id,
      payment_type: "tenant_payment",
      amount: p.amount,
      payment_date: p.payment_date,
      tenant_id: p.tenant_id,
    })),
    ...(landlordPaymentsWithNames || []).map((p) => ({
      deposit_id: deposit.id,
      payment_id: p.id,
      payment_type: "landlord_payment",
      amount: p.amount,
      payment_date: p.payment_date,
      landlord_id: p.landlord_id,
    })),
  ]

  if (depositItems.length > 0) {
    const { error: itemsError } = await supabase.from("deposit_items").insert(depositItems)
    if (itemsError) {
      console.error("Error creating deposit items:", itemsError)
      throw new Error("Failed to create deposit items: " + itemsError.message)
    }
  }

  if (tenantPayments && tenantPayments.length > 0) {
    await supabase
      .from("tenant_payments")
      .update({ deposit_id: deposit.id, is_deposited: true })
      .in(
        "id",
        tenantPayments.map((p) => p.id),
      )
  }

  if (landlordPaymentsWithNames && landlordPaymentsWithNames.length > 0) {
    await supabase
      .from("landlord_payments")
      .update({ deposit_id: deposit.id, is_deposited: true })
      .in(
        "id",
        landlordPaymentsWithNames.map((p) => p.id),
      )
  }

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("gl_account_id")
    .eq("id", bankAccountId)
    .single()

  if (!bankAccount?.gl_account_id) {
    console.error("Bank account has no GL account linkage!")
    throw new Error("Bank account is not linked to a GL account")
  }

  const { data: undepositedAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "1015")
    .single()

  if (!undepositedAccount) {
    console.error("Undeposited Funds account (1015) not found!")
    throw new Error("Undeposited Funds GL account not found")
  }

  console.log("Creating GL entries...")
  console.log("Bank GL Account ID:", bankAccount.gl_account_id)
  console.log("Undeposited GL Account ID:", undepositedAccount.id)
  console.log("Amount:", totalAmount)

  const { data: glEntries, error: glError } = await supabase
    .from("general_ledger")
    .insert([
      {
        account_id: bankAccount.gl_account_id,
        transaction_date: depositDate,
        debit: totalAmount,
        credit: 0,
        description: depositDescription,
        reference_id: deposit.id,
        reference_type: "deposit",
      },
      {
        account_id: undepositedAccount.id,
        transaction_date: depositDate,
        debit: 0,
        credit: totalAmount,
        description: depositDescription,
        reference_id: deposit.id,
        reference_type: "deposit",
      },
    ])
    .select()

  if (glError) {
    console.error("CRITICAL: GL entry creation failed:", glError)
    throw new Error("Failed to create GL entries: " + glError.message)
  }

  console.log("GL entries created successfully:", glEntries?.length || 0)

  revalidatePath("/accounting")
  revalidatePath("/accounting/cash-management")
  return deposit
}

export async function getLandlordStatements() {
  const supabase = getServiceClient()

  const { data, error } = await supabase.from("landlord_balances").select("*").order("landlord_name")

  if (error) {
    console.error("Error fetching landlord statements:", error)
    throw new Error("Failed to fetch landlord statements")
  }

  return data || []
}

export async function getLandlordSubledger(landlordId: string) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("landlord_subledger")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("Error fetching landlord subledger:", error)
    throw new Error("Failed to fetch landlord subledger")
  }

  return data || []
}

export async function getProfitAndLossStatement(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  const { data: glData, error } = await supabase
    .from("general_ledger")
    .select(
      `
      id,
      account_id,
      debit,
      credit,
      transaction_date,
      chart_of_accounts!account_id(id, account_code, account_name, account_type)
    `,
    )
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)

  if (error) {
    console.error("Error fetching GL data:", error)
    return { period: { startDate, endDate }, income: [], totalIncome: 0, expenses: [], totalExpenses: 0, netIncome: 0 }
  }

  const incomeByAccount: Record<string, any> = {}
  const expenseByAccount: Record<string, any> = {}

  glData?.forEach((entry: any) => {
    const account = entry.chart_of_accounts
    if (!account) return

    if (account.account_type === "income") {
      if (!incomeByAccount[account.id]) {
        incomeByAccount[account.id] = {
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          amount: 0,
        }
      }
      incomeByAccount[account.id].amount += entry.credit - entry.debit
    } else if (account.account_type === "expense") {
      if (!expenseByAccount[account.id]) {
        expenseByAccount[account.id] = {
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          amount: 0,
        }
      }
      expenseByAccount[account.id].amount += entry.debit - entry.credit
    }
  })

  const income = Object.values(incomeByAccount)
  const expenses = Object.values(expenseByAccount)
  const totalIncome = income.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0)

  return {
    period: { startDate, endDate },
    income,
    totalIncome,
    expenses,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
  }
}

export async function getBalanceSheet(asOfDate: string) {
  const supabase = getServiceClient()

  const { data: balances } = await supabase.from("account_balances").select("*")

  const assets = balances?.filter((b) => b.account_type === "asset") || []
  const liabilities = balances?.filter((b) => b.account_type === "liability") || []
  const equity = balances?.filter((b) => b.account_type === "equity") || []

  const totalAssets = assets.reduce((sum, a) => sum + (a.current_balance || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, a) => sum + (a.current_balance || 0), 0)
  const totalEquity = equity.reduce((sum, a) => sum + (a.current_balance || 0), 0)

  return {
    asOfDate,
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity,
    totalEquity,
    total: totalAssets,
    liabilitiesAndEquity: totalLiabilities + totalEquity,
  }
}

export async function getCashFlowStatement(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  const { data: operatingTransactions } = await supabase
    .from("general_ledger")
    .select("debit, credit, account_id")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)

  const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_type")

  const operatingCashFlow = (operatingTransactions || []).reduce((sum: number, tx: any) => {
    const account = accounts?.find((a) => a.id === tx.account_id)
    if (account?.account_type === "income") return sum + (tx.credit || 0)
    if (account?.account_type === "expense") return sum - (tx.debit || 0)
    return sum
  }, 0)

  const investingCashFlow = 0 // Can be expanded

  const financingCashFlow = 0 // Can be expanded

  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

  return {
    period: { startDate, endDate },
    operatingActivities: operatingCashFlow,
    investingActivities: investingCashFlow,
    financingActivities: financingCashFlow,
    netCashFlow,
  }
}

export async function getTrialBalance(asOfDate: string) {
  const supabase = getServiceClient()

  const { data: balances, error } = await supabase.from("account_balances").select("*").order("account_code")

  if (error) {
    console.error("Error fetching trial balance:", error)
    throw new Error("Failed to fetch trial balance")
  }

  const totalDebits = (balances || []).reduce((sum, b) => {
    if (b.normal_balance === "debit") return sum + (b.current_balance || 0)
    return sum
  }, 0)

  const totalCredits = (balances || []).reduce((sum, b) => {
    if (b.normal_balance === "credit") return sum + (b.current_balance || 0)
    return sum
  }, 0)

  return {
    asOfDate,
    accounts: balances || [],
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
  }
}

export async function calculateVAT(amount: number, vatRate = 0.18) {
  return amount * vatRate
}

export async function calculatePAYE(grossSalary: number) {
  const taxBrackets = [
    { upTo: 0, rate: 0 },
    { upTo: 585000, rate: 0 },
    { upTo: 1410000, rate: 0.1 },
    { upTo: 2000000, rate: 0.2 },
    { upTo: 3000000, rate: 0.3 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.35 },
  ]

  let tax = 0
  let previousLimit = 0

  for (const bracket of taxBrackets) {
    if (grossSalary > bracket.upTo) {
      const taxableInBracket = Math.min(grossSalary, bracket.upTo) - previousLimit
      if (taxableInBracket > 0) {
        tax += taxableInBracket * bracket.rate
      }
      previousLimit = bracket.upTo
    }
  }

  return tax
}

export async function calculateWithholdingTax(amount: number, witholdingRate = 0.05) {
  return amount * witholdingRate
}

export async function getTaxConfiguration() {
  const supabase = getServiceClient()

  const { data, error } = await supabase.from("tax_configuration").select("*").single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching tax configuration:", error)
    throw new Error("Failed to fetch tax configuration")
  }

  return (
    data || {
      vat_rate: 0.18,
      paye_enabled: true,
      withholding_tax_rate: 0.05,
      nssf_rate: 0.1,
      sacco_rate: 0.0,
    }
  )
}

export async function getTaxReport(startDate: string, endDate: string) {
  const supabase = getServiceClient()

  const { data: transactions } = await supabase
    .from("tax_transactions")
    .select("*")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: false })

  if (!transactions) {
    return {
      period: { startDate, endDate },
      vat: { collected: 0, paid: 0, balance: 0 },
      paye: { deducted: 0, paid: 0, balance: 0 },
      withholding: { deducted: 0, paid: 0, balance: 0 },
      totalTaxObligations: 0,
    }
  }

  const vat = transactions
    .filter((t) => t.tax_type === "VAT")
    .reduce(
      (acc, t) => ({ collected: acc.collected + t.amount, paid: acc.paid + (t.status === "paid" ? t.amount : 0) }),
      { collected: 0, paid: 0 },
    )

  const paye = transactions
    .filter((t) => t.tax_type === "PAYE")
    .reduce(
      (acc, t) => ({ deducted: acc.deducted + t.amount, paid: acc.paid + (t.status === "paid" ? t.amount : 0) }),
      { deducted: 0, paid: 0 },
    )

  const withholding = transactions
    .filter((t) => t.tax_type === "WITHHOLDING_TAX")
    .reduce(
      (acc, t) => ({ deducted: acc.deducted + t.amount, paid: acc.paid + (t.status === "paid" ? t.amount : 0) }),
      { deducted: 0, paid: 0 },
    )

  return {
    period: { startDate, endDate },
    vat: { ...vat, balance: vat.collected - vat.paid },
    paye: { ...paye, balance: paye.deducted - paye.paid },
    withholding: { ...withholding, balance: withholding.deducted - withholding.paid },
    totalTaxObligations:
      vat.collected - vat.paid + (paye.deducted - paye.paid) + (withholding.deducted - withholding.paid),
  }
}

export async function recordTaxTransaction(taxType: string, amount: number, description: string, referenceId?: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("tax_transactions").insert({
    tax_type: taxType,
    amount,
    description,
    reference_id: referenceId,
    status: "pending",
    transaction_date: new Date().toISOString().split("T")[0],
  })

  if (error) {
    console.error("Error recording tax transaction:", error)
    throw new Error("Failed to record tax transaction")
  }

  revalidatePath("/accounting/tax-management")
}

export async function getBankReconciliation(bankAccountId: string, statementDate: string) {
  const supabase = getServiceClient()

  const { data: glEntries } = await supabase
    .from("general_ledger")
    .select("*")
    .eq("account_id", bankAccountId)
    .lte("transaction_date", statementDate)
    .order("transaction_date")

  const { data: bankAccount } = await supabase.from("bank_accounts").select("balance").eq("id", bankAccountId).single()

  const glBalance = (glEntries || []).reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0) || 0

  const discrepancy = (bankAccount?.balance || 0) - glBalance

  return {
    bankAccountId,
    statementDate,
    bankStatement: bankAccount?.balance || 0,
    glBalance,
    discrepancy,
    isReconciled: Math.abs(discrepancy) < 0.01,
    entries: glEntries || [],
  }
}

export async function getAccountReconciliation(accountId: string, asOfDate: string) {
  const supabase = getServiceClient()

  const { data: glEntries } = await supabase
    .from("general_ledger")
    .select("*")
    .eq("account_id", accountId)
    .lte("transaction_date", asOfDate)
    .order("transaction_date")

  const { data: account } = await supabase
    .from("account_balances")
    .select("current_balance")
    .eq("id", accountId)
    .single()

  let runningBalance = 0
  const entries = (glEntries || []).map((entry) => {
    runningBalance += (entry.debit || 0) - (entry.credit || 0)
    return { ...entry, runningBalance }
  })

  const glBalance = runningBalance
  const accountBalance = account?.current_balance || 0
  const discrepancy = accountBalance - glBalance

  return {
    accountId,
    asOfDate,
    accountBalance,
    glBalance,
    discrepancy,
    isReconciled: Math.abs(discrepancy) < 0.01,
    entries,
  }
}

export async function recordReconciliation(
  reconciliationType: string,
  referenceId: string,
  reconciliationDate: string,
  notes?: string,
) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("reconciliations").insert({
    reconciliation_type: reconciliationType,
    reference_id: referenceId,
    reconciliation_date: reconciliationDate,
    notes,
    status: "completed",
  })

  if (error) {
    console.error("Error recording reconciliation:", error)
    throw new Error("Failed to record reconciliation")
  }

  revalidatePath("/accounting/reconciliation")
}

export async function getReconciliationHistory(limit = 50) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("reconciliations")
    .select("*")
    .order("reconciliation_date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching reconciliation history:", error)
    throw new Error("Failed to fetch reconciliation history")
  }

  return data || []
}

export async function getAccountingDashboard() {
  const supabase = getServiceClient()

  const [chartData, glData, balances] = await Promise.all([
    getChartOfAccounts(),
    getGeneralLedger(),
    getAccountBalances(),
  ])

  const totalAssets = balances
    .filter((b) => b.account_type === "asset")
    .reduce((sum, b) => sum + (b.current_balance || 0), 0)
  const totalLiabilities = balances
    .filter((b) => b.account_type === "liability")
    .reduce((sum, b) => sum + (b.current_balance || 0), 0)
  const totalEquity = balances
    .filter((b) => b.account_type === "equity")
    .reduce((sum, b) => sum + (b.current_balance || 0), 0)

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    accountsCount: balances.length,
    totalTransactions: glData.length,
  }
}

export async function getBankReconciliationSummary() {
  const supabase = getServiceClient()

  const { data: banks } = await supabase.from("bank_accounts").select("id, account_name, bank_name, balance")

  if (!banks || banks.length === 0) {
    return {
      accounts: [],
      totalBalance: 0,
      isReconciled: false,
    }
  }

  return {
    accounts: banks.map((bank) => ({
      id: bank.id,
      name: `${bank.bank_name} - ${bank.account_name}`,
      balance: bank.balance,
    })),
    totalBalance: banks.reduce((sum, b) => sum + (b.balance || 0), 0),
    isReconciled: true,
  }
}

export async function getAccountReconciliationSummary() {
  const supabase = getServiceClient()

  const { data: accounts } = await supabase.from("chart_of_accounts").select("id, account_name, account_type")

  const { data: glData } = await supabase.from("general_ledger").select("debit, credit")

  const totalDebits = (glData || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
  const totalCredits = (glData || []).reduce((sum, entry) => sum + (entry.credit || 0), 0)

  return {
    totalDebits,
    totalCredits,
    accounts: accounts || [],
  }
}

export async function createBankAccount(data: {
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber?: string
  glAccountId: string
  currency: string
  initialBalance?: number
  notes?: string
}) {
  const supabase = getServiceClient()

  const { data: bankAccount, error } = await supabase
    .from("bank_accounts")
    .insert({
      account_name: data.accountName,
      bank_name: data.bankName,
      account_number: data.accountNumber,
      routing_number: data.routingNumber || null,
      gl_account_id: data.glAccountId,
      currency: data.currency,
      balance: data.initialBalance || 0,
      is_active: true,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating bank account:", error)
    throw new Error("Failed to create bank account")
  }

  if (data.initialBalance && data.initialBalance > 0) {
    const { data: cashAccount } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("account_code", "3001")
      .single()

    if (cashAccount) {
      await supabase.from("general_ledger").insert([
        {
          account_id: data.glAccountId,
          transaction_date: new Date().toISOString().split("T")[0],
          debit: data.initialBalance,
          credit: 0,
          description: `Initial balance for ${data.bankName} - ${data.accountName}`,
          reference_id: bankAccount.id,
          reference_type: "bank_opening",
        },
        {
          account_id: cashAccount.id,
          transaction_date: new Date().toISOString().split("T")[0],
          debit: 0,
          credit: data.initialBalance,
          description: `Initial balance for ${data.bankName} - ${data.accountName}`,
          reference_id: bankAccount.id,
          reference_type: "bank_opening",
        },
      ])
    }
  }

  return bankAccount
}

export async function updateBankAccount(
  bankAccountId: string,
  data: {
    accountName?: string
    bankName?: string
    accountNumber?: string
    routingNumber?: string
    isActive?: boolean
    notes?: string
  },
) {
  const supabase = getServiceClient()

  const { data: bankAccount, error } = await supabase
    .from("bank_accounts")
    .update({
      account_name: data.accountName,
      bank_name: data.bankName,
      account_number: data.accountNumber,
      routing_number: data.routingNumber,
      is_active: data.isActive,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bankAccountId)
    .select()
    .single()

  if (error) {
    console.error("Error updating bank account:", error)
    throw new Error("Failed to update bank account")
  }

  return bankAccount
}

export async function getBankTransactions(bankAccountId: string) {
  const supabase = getServiceClient()

  console.log("Fetching transactions for bank:", bankAccountId)

  const { data: bankAccount } = await supabase
    .from("bank_accounts")
    .select("gl_account_id, account_name, bank_name")
    .eq("id", bankAccountId)
    .single()

  if (!bankAccount) {
    throw new Error("Bank account not found")
  }

  console.log("Bank account GL ID:", bankAccount.gl_account_id)

  const { data: transactions, error } = await supabase
    .from("general_ledger")
    .select("*")
    .eq("account_id", bankAccount.gl_account_id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100)

  console.log("Found transactions:", transactions?.length)
  console.log("First transaction:", transactions?.[0])

  if (error) {
    console.error("Error fetching bank transactions:", error)
    throw new Error("Failed to fetch bank transactions")
  }

  return {
    bankAccount,
    transactions: transactions || [],
  }
}

export async function getChartOfAccountsForBanks() {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name, account_type")
    .eq("account_type", "Asset")
    .gte("account_code", "1000")
    .lte("account_code", "1099")
    .eq("is_active", true)
    .order("account_code", { ascending: true })

  if (error) {
    console.error("Error fetching GL accounts:", error)
    throw new Error("Failed to fetch GL accounts")
  }

  return data || []
}

// New function to get undeposited funds transaction history
export async function getUndepositedFundsHistory(startDate?: string, endDate?: string) {
  const supabase = getServiceClient()

  console.log("Fetching undeposited funds history")

  // Get the Undeposited Funds GL account (1015)
  const { data: undepositedAccount } = await supabase
    .from("chart_of_accounts")
    .select("id, account_code, account_name")
    .eq("account_code", "1015")
    .single()

  if (!undepositedAccount) {
    throw new Error("Undeposited Funds account not found")
  }

  console.log("Undeposited Funds GL Account ID:", undepositedAccount.id)

  // Build query for GL transactions
  let query = supabase
    .from("general_ledger")
    .select("*")
    .eq("account_id", undepositedAccount.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (startDate) {
    query = query.gte("transaction_date", startDate)
  }

  if (endDate) {
    query = query.lte("transaction_date", endDate)
  }

  const { data: transactions, error } = await query.limit(200)

  console.log("Found undeposited funds transactions:", transactions?.length)

  if (error) {
    console.error("Error fetching undeposited funds history:", error)
    throw new Error("Failed to fetch undeposited funds history")
  }

  return {
    undepositedAccount,
    transactions: transactions || [],
  }
}
