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

export async function createInvoice(
  invoiceData: {
    invoiceNumber: string
    propertyId: string
    tenantId?: string
    landlordId?: string
    invoiceType: string
    invoiceDate: string
    dueDate: string
    amount: number
    vatAmount?: number
    description?: string
    paymentTerms?: string
    templateId?: string
    recurring?: boolean
    recurrencePattern?: string
  },
  items: Array<{ description: string; quantity: number; unitPrice: number }>,
) {
  const supabase = getServiceClient()

  const totalAmount = invoiceData.amount + (invoiceData.vatAmount || 0)

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceData.invoiceNumber,
      property_id: invoiceData.propertyId,
      tenant_id: invoiceData.tenantId,
      landlord_id: invoiceData.landlordId,
      invoice_type: invoiceData.invoiceType,
      invoice_date: invoiceData.invoiceDate,
      due_date: invoiceData.dueDate,
      amount: invoiceData.amount,
      vat_amount: invoiceData.vatAmount || 0,
      total_amount: totalAmount,
      description: invoiceData.description,
      payment_terms: invoiceData.paymentTerms,
      template_id: invoiceData.templateId,
      recurring: invoiceData.recurring || false,
      recurrence_pattern: invoiceData.recurrencePattern,
      status: "draft",
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single()

  if (invoiceError) {
    console.error("[v0] Error creating invoice:", invoiceError)
    throw new Error("Failed to create invoice")
  }

  // Add invoice items
  for (const item of items) {
    await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      item_total: item.quantity * item.unitPrice,
    })
  }

  // Record GL entry
  const { data: serviceIncomeAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "4020")
    .single()

  const { data: receivableAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("account_code", "1030")
    .single()

  if (serviceIncomeAccount && receivableAccount) {
    await supabase.from("general_ledger").insert([
      {
        account_id: receivableAccount.id,
        transaction_date: invoiceData.invoiceDate,
        debit: totalAmount,
        credit: 0,
        description: `Invoice ${invoiceData.invoiceNumber}`,
        reference_id: invoice.id,
        reference_type: "invoice",
      },
      {
        account_id: serviceIncomeAccount.id,
        transaction_date: invoiceData.invoiceDate,
        debit: 0,
        credit: totalAmount,
        description: `Invoice ${invoiceData.invoiceNumber}`,
        reference_id: invoice.id,
        reference_type: "invoice",
      },
    ])
  }

  revalidatePath("/accounting/invoicing")
  return invoice
}

export async function getInvoices(status?: string, tenantId?: string) {
  const supabase = getServiceClient()

  let query = supabase.from("invoices").select("*, invoice_items(*)")

  if (status) {
    query = query.eq("status", status)
  }

  if (tenantId) {
    query = query.eq("tenant_id", tenantId)
  }

  const { data, error } = await query.order("invoice_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching invoices:", error)
    throw new Error("Failed to fetch invoices")
  }

  return data || []
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.from("invoices").update({ status }).eq("id", invoiceId)

  if (error) {
    console.error("[v0] Error updating invoice status:", error)
    throw new Error("Failed to update invoice status")
  }

  revalidatePath("/accounting/invoicing")
}

export async function createRecurringInvoice(recurringData: {
  tenantId?: string
  landlordId?: string
  amount: number
  frequency: string
  nextInvoiceDate: string
  templateId?: string
}) {
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("recurring_invoices")
    .insert({
      tenant_id: recurringData.tenantId,
      landlord_id: recurringData.landlordId,
      amount: recurringData.amount,
      frequency: recurringData.frequency,
      next_invoice_date: recurringData.nextInvoiceDate,
      template_id: recurringData.templateId,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating recurring invoice:", error)
    throw new Error("Failed to create recurring invoice")
  }

  revalidatePath("/accounting/invoicing")
  return data
}

export async function processRecurringInvoices() {
  const supabase = getServiceClient()

  const today = new Date().toISOString().split("T")[0]

  const { data: dueInvoices } = await supabase
    .from("recurring_invoices")
    .select("*")
    .eq("status", "active")
    .lte("next_invoice_date", today)

  for (const recurring of dueInvoices || []) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    await createInvoice(
      {
        invoiceNumber,
        propertyId: "",
        invoiceType: "service",
        invoiceDate: today,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
        amount: recurring.amount,
        templateId: recurring.template_id,
      },
      [],
    )

    // Calculate next invoice date based on frequency
    const nextDate = new Date(recurring.next_invoice_date)
    switch (recurring.frequency) {
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    await supabase
      .from("recurring_invoices")
      .update({
        next_invoice_date: nextDate.toISOString().split("T")[0],
        last_invoice_date: today,
      })
      .eq("id", recurring.id)
  }

  revalidatePath("/accounting/invoicing")
}

export async function getOverdueInvoices() {
  const supabase = getServiceClient()

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .lt("due_date", today)
    .in("status", ["sent", "overdue"])
    .order("due_date")

  if (error) {
    console.error("[v0] Error fetching overdue invoices:", error)
    throw new Error("Failed to fetch overdue invoices")
  }

  return data || []
}

export async function getInvoiceSummary() {
  const supabase = getServiceClient()

  const { data: invoices } = await supabase.from("invoices").select("status, total_amount")

  const summary = {
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    totalRevenue: 0,
  }

  for (const invoice of invoices || []) {
    summary[invoice.status as keyof typeof summary] =
      (summary[invoice.status as keyof typeof summary] as number) + (invoice.total_amount || 0)
    if (invoice.status === "paid") {
      summary.totalRevenue += invoice.total_amount || 0
    }
  }

  return summary
}
