"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Generate Trial Balance
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      },
    )

    // Check admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const asOfDate = searchParams.get("as_of_date") || new Date().toISOString().split("T")[0]

    // Get all active accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("is_active", true)
      .order("account_code", { ascending: true })

    if (accountsError) {
      return NextResponse.json({ success: false, error: accountsError.message }, { status: 500 })
    }

    // Calculate balances for each account
    const trialBalance = await Promise.all(
      accounts.map(async (account) => {
        const { data: glEntries } = await supabase
          .from("general_ledger")
          .select("debit_amount, credit_amount")
          .eq("account_id", account.id)
          .eq("status", "POSTED")
          .lte("transaction_date", asOfDate)
          .eq("is_reversed", false)

        let totalDebit = 0
        let totalCredit = 0

        if (glEntries) {
          totalDebit = glEntries.reduce((sum, entry) => sum + parseFloat(String(entry.debit_amount)), 0)
          totalCredit = glEntries.reduce((sum, entry) => sum + parseFloat(String(entry.credit_amount)), 0)
        }

        // Calculate balance based on normal balance
        let debitBalance = 0
        let creditBalance = 0

        if (account.normal_balance === "ASSET" || account.normal_balance === "EXPENSE") {
          debitBalance = totalDebit - totalCredit
        } else {
          creditBalance = totalCredit - totalDebit
        }

        return {
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          debit_balance: debitBalance,
          credit_balance: creditBalance,
        }
      }),
    )

    // Filter out accounts with zero balance (optional - can be toggled)
    const filteredBalance = trialBalance.filter((acc) => acc.debit_balance !== 0 || acc.credit_balance !== 0)

    const totalDebits = filteredBalance.reduce((sum, acc) => sum + acc.debit_balance, 0)
    const totalCredits = filteredBalance.reduce((sum, acc) => sum + acc.credit_balance, 0)

    return NextResponse.json({
      success: true,
      data: {
        as_of_date: asOfDate,
        accounts: filteredBalance,
        total_debits: totalDebits,
        total_credits: totalCredits,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
