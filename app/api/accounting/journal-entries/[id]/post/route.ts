"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// POST - Post journal entry to General Ledger
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check if journal entry exists
    const { data: journalEntry } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", id)
      .single()

    if (!journalEntry) {
      return NextResponse.json({ success: false, error: "Journal entry not found" }, { status: 404 })
    }

    if (journalEntry.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Journal entry is not in DRAFT status" },
        { status: 400 },
      )
    }

    // Check if period is locked
    const { data: period } = await supabase
      .from("accounting_periods")
      .select("is_locked")
      .eq("period_month", journalEntry.period_month)
      .eq("period_year", journalEntry.period_year)
      .single()

    if (period?.is_locked) {
      return NextResponse.json(
        { success: false, error: "Accounting period is locked and cannot be modified" },
        { status: 400 },
      )
    }

    // Call the database function to post the journal entry
    const { error: postError } = await supabase.rpc("post_journal_entry", {
      p_journal_entry_id: id,
    })

    if (postError) {
      return NextResponse.json({ success: false, error: postError.message }, { status: 500 })
    }

    // Fetch updated journal entry
    const { data: updatedEntry } = await supabase
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
      .eq("id", id)
      .single()

    return NextResponse.json({ success: true, data: updatedEntry, message: "Journal entry posted successfully" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
