"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - List all chart of accounts
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

    const { data: accounts, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_code", { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Create new chart of account
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
    const {
      account_code,
      account_name,
      account_type,
      account_category,
      parent_account_id,
      level,
      description,
      normal_balance,
      currency = "UGX",
    } = body

    // Validate required fields
    if (!account_code || !account_name || !account_type || !normal_balance) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if account code already exists
    const { data: existing } = await supabase
      .from("chart_of_accounts")
      .select("id")
      .eq("account_code", account_code)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: "Account code already exists" }, { status: 400 })
    }

    // Calculate level if not provided
    let calculatedLevel = level || 1
    if (parent_account_id) {
      const { data: parent } = await supabase
        .from("chart_of_accounts")
        .select("level")
        .eq("id", parent_account_id)
        .single()
      if (parent) {
        calculatedLevel = parent.level + 1
      }
    }

    const { data: account, error } = await supabase
      .from("chart_of_accounts")
      .insert({
        account_code,
        account_name,
        account_type,
        account_category,
        parent_account_id: parent_account_id || null,
        level: calculatedLevel,
        description,
        normal_balance,
        currency,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
