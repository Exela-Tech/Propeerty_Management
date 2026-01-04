"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Get General Ledger entries
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
    const accountId = searchParams.get("account_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const periodMonth = searchParams.get("period_month")
    const periodYear = searchParams.get("period_year")

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

    if (accountId) {
      query = query.eq("account_id", accountId)
    }
    if (startDate) {
      query = query.gte("transaction_date", startDate)
    }
    if (endDate) {
      query = query.lte("transaction_date", endDate)
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
