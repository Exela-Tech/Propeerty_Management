import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Building2, Users, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { PropertyPaymentCard } from "@/components/property-payment-card"

interface Property {
  id: string
  name: string
  location: string
  commission_type: "percentage" | "fixed"
  commission_value: number
  totalCollected: number
  expectedRent: number
  commissionAmount: number
  netPayable: number
  tenantCount: number
  paidToLandlord: number
  balance: number
}

interface LandlordWithProperties {
  id: string
  name: string
  email: string
  phone: string
  payment_due_day: number
  properties: Property[]
  totalExpected: number
  totalCollected: number
  totalCommission: number
  totalNetPayable: number
  totalPaid: number
  totalBalance: number
}

function getDayLabel(day: number): string {
  if (day === 30 || day === 31) return "End of Month"
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th"
  return `${day}${suffix}`
}

function getPaymentStatusBadge(dueDay: number) {
  const today = new Date()
  const currentDay = today.getDate()

  if (currentDay >= dueDay) {
    return <Badge variant="destructive">Payment Due</Badge>
  } else {
    const daysUntil = dueDay - currentDay
    return <Badge variant="secondary">Due in {daysUntil} days</Badge>
  }
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

  // Get current period
  const today = new Date()
  const currentMonth = today.toISOString().substring(0, 7)
  const [year, month] = currentMonth.split("-")
  const periodStart = `${year}-${month}-01`
  const periodEnd = `${year}-${month}-${new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()}`

  // Fetch all landlords
  const { data: landlords, error } = await supabase
    .from("owners")
    .select("id, name, email, phone, payment_due_day")
    .order("payment_due_day", { ascending: true })

  if (error) {
    console.error(" Error fetching landlords:", error)
    return (
      <div className="space-y-6 p-8">
        <div className="text-center py-12">Failed to load landlord payment schedule</div>
      </div>
    )
  }

  // Build landlord data with properties
  const landlordData: LandlordWithProperties[] = await Promise.all(
    (landlords || []).map(async (landlord) => {
      // Get all properties for this landlord with commission settings
      const { data: properties } = await supabase
        .from("properties")
        .select("id, name, location, commission_type, commission_value")
        .or(`owner_id.eq.${landlord.id},landlord_id.eq.${landlord.id}`)

      const propertiesWithData: Property[] = await Promise.all(
        (properties || []).map(async (property) => {
          // Get active tenants for this property
          const { data: tenants } = await supabase
            .from("tenants")
            .select("id, monthly_rent")
            .eq("property_id", property.id)
            .eq("status", "active")

          const tenantIds = tenants?.map((t) => t.id) || []
          const expectedRent = tenants?.reduce((sum, t) => sum + (t.monthly_rent || 0), 0) || 0

          // Get payments collected this period
          let totalCollected = 0
          if (tenantIds.length > 0) {
            const { data: payments } = await supabase
              .from("tenant_payments")
              .select("amount")
              .in("tenant_id", tenantIds)
              .gte("payment_date", periodStart)
              .lte("payment_date", periodEnd)

            totalCollected = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
          }

          // Calculate commission based on property settings
          const commissionType = property.commission_type || "percentage"
          const commissionValue = property.commission_value || 10
          let commissionAmount: number

          if (commissionType === "fixed") {
            commissionAmount = commissionValue
          } else {
            commissionAmount = (totalCollected * commissionValue) / 100
          }

          const netPayable = totalCollected - commissionAmount

          // Get payments already made to landlord for this property this period
          const { data: landlordPayments } = await supabase
            .from("landlord_payments")
            .select("amount")
            .eq("landlord_id", landlord.id)
            .eq("property_id", property.id)
            .gte("payment_date", periodStart)
            .lte("payment_date", periodEnd)

          const paidToLandlord = landlordPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
          const balance = Math.max(0, netPayable - paidToLandlord)

          return {
            id: property.id,
            name: property.name,
            location: property.location || "",
            commission_type: commissionType as "percentage" | "fixed",
            commission_value: commissionValue,
            totalCollected,
            expectedRent,
            commissionAmount,
            netPayable,
            tenantCount: tenants?.length || 0,
            paidToLandlord,
            balance,
          }
        })
      )

      // Calculate totals
      const totalExpected = propertiesWithData.reduce((sum, p) => sum + p.expectedRent, 0)
      const totalCollected = propertiesWithData.reduce((sum, p) => sum + p.totalCollected, 0)
      const totalCommission = propertiesWithData.reduce((sum, p) => sum + p.commissionAmount, 0)
      const totalNetPayable = propertiesWithData.reduce((sum, p) => sum + p.netPayable, 0)
      const totalPaid = propertiesWithData.reduce((sum, p) => sum + p.paidToLandlord, 0)
      const totalBalance = propertiesWithData.reduce((sum, p) => sum + p.balance, 0)

      return {
        ...landlord,
        properties: propertiesWithData,
        totalExpected,
        totalCollected,
        totalCommission,
        totalNetPayable,
        totalPaid,
        totalBalance,
      }
    })
  )

  // Filter landlords with properties
  const landlordsWithProperties = landlordData.filter((l) => l.properties.length > 0)

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landlord Payments</h1>
          <p className="text-muted-foreground mt-1">
            Period: {new Date(periodStart).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/landlords">
          <Button variant="outline">Back to Landlords</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              UGX {landlordData.reduce((sum, l) => sum + l.totalCollected, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              UGX {landlordData.reduce((sum, l) => sum + l.totalCommission, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              UGX {landlordData.reduce((sum, l) => sum + l.totalPaid, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              UGX {landlordData.reduce((sum, l) => sum + l.totalBalance, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Landlord List */}
      <div className="space-y-6">
        {landlordsWithProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No landlords with properties found
            </CardContent>
          </Card>
        ) : (
          landlordsWithProperties.map((landlord) => (
            <Card key={landlord.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{landlord.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{landlord.email} | {landlord.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Due: {getDayLabel(landlord.payment_due_day || 30)}</span>
                        {getPaymentStatusBadge(landlord.payment_due_day || 30)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Balance Due</p>
                      <p className="text-2xl font-bold text-red-600">UGX {landlord.totalBalance.toLocaleString()}</p>
                    </div>
                    <Link href={`/landlords/${landlord.id}/payments`}>
                      <Button variant="link" size="sm" className="text-blue-600">
                        View Payment History
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Landlord Totals */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="font-semibold">UGX {landlord.totalExpected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collected</p>
                    <p className="font-semibold text-green-600">UGX {landlord.totalCollected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="font-semibold text-orange-600">UGX {landlord.totalCommission.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Payable</p>
                    <p className="font-semibold text-blue-600">UGX {landlord.totalNetPayable.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Already Paid</p>
                    <p className="font-semibold">UGX {landlord.totalPaid.toLocaleString()}</p>
                  </div>
                </div>

                {/* Properties */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Properties ({landlord.properties.length})
                  </h4>
                  <div className="grid gap-4">
                    {landlord.properties.map((property) => (
                      <PropertyPaymentCard
                        key={property.id}
                        property={property}
                        landlordId={landlord.id}
                        landlordName={landlord.name}
                        periodStart={periodStart}
                        periodEnd={periodEnd}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
