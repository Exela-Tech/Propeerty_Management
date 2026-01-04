"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - List all journal entries
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
    const journalType = searchParams.get("journal_type")
    const status = searchParams.get("status")
    const periodMonth = searchParams.get("period_month")
    const periodYear = searchParams.get("period_year")

    let query = supabase.from("journal_entries").select("*").order("entry_date", { ascending: false })

    if (journalType) {
      query = query.eq("journal_type", journalType)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (periodMonth) {
      query = query.eq("period_month", parseInt(periodMonth))
    }
    if (periodYear) {
      query = query.eq("period_year", parseInt(periodYear))
    }

    const { data: entries, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Create new journal entry
export async function POST(request: Request) {
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

    const body = await request.json()
    const { journal_type, entry_date, description, currency = "UGX", notes, lines } = body

    // Validate required fields
    if (!journal_type || !entry_date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or invalid journal lines" },
        { status: 400 },
      )
    }

    // Validate journal is balanced (total debits = total credits)
    const totalDebit = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.debit_amount) || 0), 0)
    const totalCredit = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.credit_amount) || 0), 0)

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { success: false, error: "Journal entry is not balanced. Total debits must equal total credits." },
        { status: 400 },
      )
    }

    // Parse entry date
    const entryDate = new Date(entry_date)
    const periodMonth = entryDate.getMonth() + 1
    const periodYear = entryDate.getFullYear()

    // Check if period is locked
    const { data: period } = await supabase
      .from("accounting_periods")
      .select("is_locked")
      .eq("period_month", periodMonth)
      .eq("period_year", periodYear)
      .single()

    if (period?.is_locked) {
      return NextResponse.json(
        { success: false, error: "Accounting period is locked and cannot be modified" },
        { status: 400 },
      )
    }

    // Generate journal number
    const { data: journalNum } = await supabase.rpc("generate_journal_number", {
      j_type: journal_type,
      p_year: periodYear,
    })

    if (!journalNum) {
      return NextResponse.json({ success: false, error: "Failed to generate journal number" }, { status: 500 })
    }

    // Create journal entry
    const { data: journalEntry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        journal_number: journalNum,
        journal_type: journal_type,
        entry_date: entry_date,
        description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        currency,
        status: "DRAFT",
        period_month: periodMonth,
        period_year: periodYear,
        notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (entryError) {
      return NextResponse.json({ success: false, error: entryError.message }, { status: 500 })
    }

    // Create journal entry lines
    const journalLines = lines.map((line: any, index: number) => ({
      journal_entry_id: journalEntry.id,
      account_id: line.account_id,
      line_number: index + 1,
      description: line.description || description,
      debit_amount: parseFloat(line.debit_amount) || 0,
      credit_amount: parseFloat(line.credit_amount) || 0,
      reference_number: line.reference_number || null,
    }))

    const { error: linesError } = await supabase.from("journal_entry_lines").insert(journalLines)

    if (linesError) {
      // Rollback journal entry if lines fail
      await supabase.from("journal_entries").delete().eq("id", journalEntry.id)
      return NextResponse.json({ success: false, error: linesError.message }, { status: 500 })
    }

    // Fetch complete journal entry with lines
    const { data: completeEntry } = await supabase
      .from("journal_entries")
      .select(
        `
        *,
        journal_entry_lines (
          *,
          chart_of_accounts (
            account_code,
            account_name
          )
        )
      `,
      )
      .eq("id", journalEntry.id)
      .single()

    return NextResponse.json({ success: true, data: completeEntry })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
