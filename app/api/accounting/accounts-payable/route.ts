"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - List accounts payable
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
    const vendorId = searchParams.get("vendor_id")
    const status = searchParams.get("status")

    let query = supabase.from("accounts_payable").select("*").order("due_date", { ascending: true })

    if (vendorId) {
      query = query.eq("vendor_id", vendorId)
    }
    if (status) {
      query = query.eq("status", status)
    }

    const { data: invoices, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: invoices })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// POST - Create accounts payable invoice
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
      vendor_id,
      vendor_name,
      invoice_number,
      invoice_date,
      due_date,
      payment_terms,
      subtotal,
      tax_amount = 0,
      discount_amount = 0,
      description,
      property_id,
      expense_category,
      currency = "UGX",
    } = body

    if (!vendor_name || !invoice_number || !invoice_date || !due_date || !subtotal) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const total_amount = subtotal + tax_amount - discount_amount
    const balance_amount = total_amount

    const { data: invoice, error } = await supabase
      .from("accounts_payable")
      .insert({
        vendor_id: vendor_id || null,
        vendor_name,
        invoice_number,
        invoice_date,
        due_date,
        payment_terms: payment_terms || "NET_30",
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        paid_amount: 0,
        balance_amount,
        currency,
        status: "OPEN",
        description,
        property_id: property_id || null,
        expense_category: expense_category || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
