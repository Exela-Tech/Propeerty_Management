import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { calculateLandlordOwed } from "../payment-actions"
import { RecordPaymentDialog } from "@/components/record-payment-dialog"

interface LandlordWithPaymentInfo {
  id: string
  name: string
  email: string
  phone: string
  payment_due_day: number
  commission_percentage: number
  owed: number
  totalCollected: number
  totalPaidToLandlord: number
  tenantCount: number
  paymentCount: number
  expectedRent: number
  collectionRate: number
  commissionDeducted: number
  netPayout: number
}

function getDayLabel(day: number): string {
  if (day === 30) return "End of Month"
  if (day === 5) return "5th"
  if (day === 15) return "15th"
  return `${day}th`
}

function getPaymentStatus(
  dueDay: number,
): { status: "due"; label: string; color: string } | { status: "upcoming"; label: string; color: string } {
  const today = new Date()
  const currentDay = today.getDate()

  if (currentDay >= dueDay) {
    return { status: "due", label: "Payment Due", color: "bg-red-100 text-red-800" }
  } else {
    const daysUntil = dueDay - currentDay
    return {
      status: "upcoming",
      label: `Due in ${daysUntil} days`,
      color: "bg-blue-100 text-blue-800",
    }
  }
}

function getCollectionRateColor(rate: number): string {
  if (rate >= 95) return "text-green-600"
  if (rate >= 80) return "text-yellow-600"
  return "text-red-600"
}

export default async function LandlordPaymentsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
  })

  const { data: landlords, error } = await supabase
    .from("owners")
    .select("id, name, email, phone, payment_due_day, commission_percentage")
    .order("payment_due_day", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching landlords:", error)
    return (
      <div className="space-y-6 p-8">
        <div className="text-center py-12">Failed to load landlord payment schedule</div>
      </div>
    )
  }

  // Calculate owed amounts for each landlord
  const today = new Date()
  const currentMonth = today.toISOString().substring(0, 7)
  const [year, month] = currentMonth.split("-")
  const periodStart = `${year}-${month}-01`
  const periodEnd = `${year}-${month}-${new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()}`

  const landlordData: LandlordWithPaymentInfo[] = []

  for (const landlord of landlords || []) {
    const { data: properties } = await supabase.from("properties").select("id").eq("owner_id", landlord.id)

    const propertyIds = properties?.map((p) => p.id) || []

    let expectedRent = 0
    let tenantCount = 0
    let paymentCount = 0

    if (propertyIds.length > 0) {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, monthly_rent")
        .in("property_id", propertyIds)
        .eq("status", "active")

      tenantCount = tenants?.length || 0
      expectedRent = tenants?.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) || 0

      if (tenants && tenants.length > 0) {
        const tenantIds = tenants.map((t) => t.id)

        const { count: paymentRecords } = await supabase
          .from("tenant_payments")
          .select("*", { count: "exact", head: true })
          .in("tenant_id", tenantIds)
          .gte("payment_date", periodStart)
          .lte("payment_date", periodEnd)

        paymentCount = paymentRecords || 0
      }
    }

    const { owed, totalCollected, totalPaidToLandlord, commissionDeducted, netPayout } = await calculateLandlordOwed(
      landlord.id,
      periodStart,
      periodEnd,
    )

    const collectionRate = expectedRent > 0 ? (totalCollected / expectedRent) * 100 : 0

    landlordData.push({
      ...landlord,
      owed,
      totalCollected,
      totalPaidToLandlord,
      tenantCount,
      paymentCount,
      expectedRent,
      collectionRate,
      commissionDeducted,
      netPayout,
    })
  }

  // Group by payment due day
  const groupedByDueDay: { [key: number]: LandlordWithPaymentInfo[] } = {}
  landlordData.forEach((landlord) => {
    const day = landlord.payment_due_day || 30
    if (!groupedByDueDay[day]) {
      groupedByDueDay[day] = []
    }
    groupedByDueDay[day].push(landlord)
  })

  const sortedDays = Object.keys(groupedByDueDay)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold uppercase">LANDLORD PAYMENT SCHEDULE</h1>
        <p className="text-muted-foreground mt-1">Track landlord payments with collected rent and amounts owed</p>
      </div>

      <Link href="/landlords">
        <Button variant="outline">← Back to Landlords</Button>
      </Link>

      <div className="space-y-6">
        {sortedDays.map((day) => {
          const landlordsList = groupedByDueDay[day]
          const status = getPaymentStatus(day)

          return (
            <Card key={day} className="overflow-hidden">
              <CardHeader className={`${status.status === "due" ? "bg-red-50" : "bg-blue-50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{getDayLabel(day)}</CardTitle>
                      <CardDescription>{landlordsList.length} landlords</CardDescription>
                    </div>
                  </div>
                  <Badge className={status.color}>
                    {status.status === "due" ? (
                      <AlertCircle className="mr-1 h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                    )}
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {landlordsList.map((landlord) => (
                    <div key={landlord.id} className="p-4 border rounded-lg hover:bg-accent transition">
                      {/* Landlord Info */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                        <div className="flex-1">
                          <p className="font-medium">{landlord.name}</p>
                          <p className="text-sm text-muted-foreground">{landlord.email}</p>
                          <p className="text-sm text-muted-foreground">{landlord.phone}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">EXPECTED RENT</p>
                          <p className="font-semibold">UGX {Math.round(landlord.expectedRent).toLocaleString()}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">COLLECTED</p>
                          <p className="font-semibold text-green-600">
                            UGX {Math.round(landlord.totalCollected).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">
                            COMMISSION ({landlord.commission_percentage}%)
                          </p>
                          <p className="font-semibold text-orange-600">
                            UGX {Math.round(landlord.commissionDeducted).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">NET PAYOUT</p>
                          <p className="font-bold text-lg text-blue-600">
                            UGX {Math.round(landlord.netPayout).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Amount Owed</p>
                            <p className="font-bold text-lg text-red-600">
                              UGX {Math.round(landlord.owed).toLocaleString()}
                            </p>
                          </div>
                          <RecordPaymentDialog landlord={landlord} periodStart={periodStart} periodEnd={periodEnd} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-3 border-t text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>Tenants: {landlord.tenantCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Payments: {landlord.paymentCount}</span>
                        </div>
                        <div className="text-right">
                          <Link
                            href={`/landlords/${landlord.id}/payments`}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            View Payment History →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
