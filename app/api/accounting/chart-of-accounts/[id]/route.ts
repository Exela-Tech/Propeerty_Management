"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Get single chart of account
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { data: account, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// PUT - Update chart of account
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json()
    const { account_name, account_category, description, is_active } = body

    // Check if account is system account (cannot modify certain fields)
    const { data: existing } = await supabase
      .from("chart_of_accounts")
      .select("is_system_account")
      .eq("id", id)
      .single()

    if (!existing) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 })
    }

    const updateData: any = {
      updated_by: user.id,
    }

    if (account_name !== undefined) updateData.account_name = account_name
    if (account_category !== undefined) updateData.account_category = account_category
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined && !existing.is_system_account) {
      updateData.is_active = is_active
    }

    const { data: account, error } = await supabase
      .from("chart_of_accounts")
      .update(updateData)
      .eq("id", id)
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

// DELETE - Delete chart of account (only if not system account and no transactions)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if account exists and is system account
    const { data: account } = await supabase
      .from("chart_of_accounts")
      .select("is_system_account")
      .eq("id", id)
      .single()

    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 })
    }

    if (account.is_system_account) {
      return NextResponse.json({ success: false, error: "Cannot delete system account" }, { status: 400 })
    }

    // Check if account has transactions
    const { count: transactionCount } = await supabase
      .from("general_ledger")
      .select("*", { count: "exact", head: true })
      .eq("account_id", id)

    if (transactionCount && transactionCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete account with existing transactions" },
        { status: 400 },
      )
    }

    // Check if account has child accounts
    const { count: childCount } = await supabase
      .from("chart_of_accounts")
      .select("*", { count: "exact", head: true })
      .eq("parent_account_id", id)

    if (childCount && childCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete account with child accounts" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
