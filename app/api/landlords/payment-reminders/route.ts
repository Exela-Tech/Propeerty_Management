import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

interface PaymentReminder {
  landlordId: string
  landlordName: string
  email: string
  phone: string
  paymentDueDay: number
  amountOwed: number
  totalCollected: number
  daysUntilDue: number
  isDue: boolean
}

/**
 * GET /api/landlords/payment-reminders
 * Returns list of landlords with upcoming or due payments
 * Can be called by a cron job or scheduled task
 */
export async function GET(request: Request) {
  try {
    const supabase = getServiceClient()
    const today = new Date()
    const currentDay = today.getDate()

    // Get all landlords with their payment due days
    const { data: landlords, error: landlordsError } = await supabase
      .from("owners")
      .select("id, name, email, phone, payment_due_day")
      .not("payment_due_day", "is", null)

    if (landlordsError) {
      return NextResponse.json({ error: landlordsError.message }, { status: 400 })
    }

    if (!landlords || landlords.length === 0) {
      return NextResponse.json({ reminders: [], message: "No landlords with payment due dates found" })
    }

    // Calculate current month period
    const currentMonth = today.toISOString().substring(0, 7)
    const [year, month] = currentMonth.split("-")
    const periodStart = `${year}-${month}-01`
    const periodEnd = `${year}-${month}-${new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()}`

    const reminders: PaymentReminder[] = []

    for (const landlord of landlords) {
      const dueDay = landlord.payment_due_day || 30
      const daysUntilDue = dueDay >= currentDay ? dueDay - currentDay : 0
      const isDue = currentDay >= dueDay

      // Calculate amount owed
      const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", landlord.id)

      if (!properties || properties.length === 0) {
        continue
      }

      const propertyIds = properties.map((p) => p.id)
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, monthly_rent")
        .in("property_id", propertyIds)
        .eq("status", "active")

      if (!tenants || tenants.length === 0) {
        continue
      }

      const tenantIds = tenants.map((t) => t.id)

      // Get payments received from tenants
      const { data: payments } = await supabase
        .from("tenant_payments")
        .select("amount")
        .in("tenant_id", tenantIds)
        .gte("payment_date", periodStart)
        .lte("payment_date", periodEnd)

      const totalCollected = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      // Get previous payments to landlord
      const { data: previousPayments } = await supabase
        .from("landlord_payments")
        .select("amount")
        .eq("landlord_id", landlord.id)
        .gte("payment_date", periodStart)
        .lte("payment_date", periodEnd)

      const totalPaidToLandlord = previousPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const amountOwed = Math.max(0, totalCollected - totalPaidToLandlord)

      // Only include landlords with amounts owed or upcoming due dates
      if (amountOwed > 0 || isDue || daysUntilDue <= 3) {
        reminders.push({
          landlordId: landlord.id,
          landlordName: landlord.name || "Unknown",
          email: landlord.email || "",
          phone: landlord.phone || "",
          paymentDueDay: dueDay,
          amountOwed,
          totalCollected,
          daysUntilDue: isDue ? 0 : daysUntilDue,
          isDue,
        })
      }
    }

    // Sort by due status and days until due
    reminders.sort((a, b) => {
      if (a.isDue && !b.isDue) return -1
      if (!a.isDue && b.isDue) return 1
      return a.daysUntilDue - b.daysUntilDue
    })

    return NextResponse.json({
      reminders,
      total: reminders.length,
      due: reminders.filter((r) => r.isDue).length,
      upcoming: reminders.filter((r) => !r.isDue).length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] Error generating payment reminders:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/landlords/payment-reminders/send
 * Sends payment reminders (can be integrated with email service)
 */
export async function POST(request: Request) {
  try {
    const { sendEmails = false } = await request.json().catch(() => ({ sendEmails: false }))

    // Get reminders
    const remindersResponse = await GET(request)
    const remindersData = await remindersResponse.json()

    if (!remindersData.reminders) {
      return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 400 })
    }

    const reminders: PaymentReminder[] = remindersData.reminders

    // In a real implementation, you would:
    // 1. Send emails using a service like SendGrid, Resend, or AWS SES
    // 2. Send SMS using Twilio or similar
    // 3. Create in-app notifications
    // 4. Log the reminders to a notifications table

    const notificationResults = reminders.map((reminder) => {
      const message = reminder.isDue
        ? `Payment due today for ${reminder.landlordName}. Amount owed: UGX ${Math.round(reminder.amountOwed).toLocaleString()}`
        : `Payment reminder: ${reminder.landlordName} has payment due in ${reminder.daysUntilDue} days. Amount owed: UGX ${Math.round(reminder.amountOwed).toLocaleString()}`

      return {
        landlordId: reminder.landlordId,
        landlordName: reminder.landlordName,
        email: reminder.email,
        phone: reminder.phone,
        message,
        sent: sendEmails ? false : true, // Placeholder - would be true after actual email/SMS send
        sentAt: new Date().toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      notifications: notificationResults,
      totalSent: notificationResults.length,
      message: sendEmails
        ? "Reminders generated. Email sending not implemented yet."
        : "Reminders generated successfully. Configure email service to send notifications.",
    })
  } catch (error: any) {
    console.error("[v0] Error sending payment reminders:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
