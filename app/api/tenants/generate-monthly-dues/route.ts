import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
    const today = new Date()
    const currentDay = today.getDate()

    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, monthly_rent, balance, rent_due_day, currency, last_due_processed, created_at, status")
      .eq("status", "active")

    if (tenantsError) {
      return Response.json({ error: tenantsError.message }, { status: 400 })
    }

    const duesToday =
      tenants?.filter((tenant) => {
        const tenantDueDay = tenant.rent_due_day || 1
        const lastProcessed = tenant.last_due_processed ? new Date(tenant.last_due_processed) : null
        const lastProcessedMonth = lastProcessed?.getMonth()
        const currentMonth = today.getMonth()

        // Generate due if due day has passed and hasn't been processed this month
        return tenantDueDay <= currentDay && lastProcessedMonth !== currentMonth
      }) || []

    for (const tenant of duesToday) {
      const newBalance = (tenant.balance || 0) + (tenant.monthly_rent || 0)

      await supabase
        .from("tenants")
        .update({
          balance: newBalance,
          payment_status: "pending",
          last_due_processed: new Date().toISOString(),
        })
        .eq("id", tenant.id)
    }

    return Response.json({
      success: true,
      message: `Generated dues for ${duesToday.length} tenants`,
      tenantsAffected: duesToday.length,
    })
  } catch (error: any) {
    console.error("[v0] Error generating monthly dues:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
