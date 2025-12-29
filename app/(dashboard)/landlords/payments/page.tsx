import { useState } from "react"

import type React from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, AlertCircle, CheckCircle2, Plus } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateLandlordOwed, recordLandlordPayment } from "../payment-actions"

interface LandlordWithPaymentInfo {
  id: string
  name: string
  email: string
  phone: string
  payment_due_day: number
  owed: number
  totalCollected: number
  totalPaidToLandlord: number
  expectedRent?: number
  collectionRate?: number
  tenantCount?: number
  paymentCount?: number
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
    .select("id, name, email, phone, payment_due_day")
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
    const {
      owed,
      totalCollected,
      totalPaidToLandlord,
      expectedRent,
      collectionRate,
      tenantCount,
      paymentCount,
    } = await calculateLandlordOwed(landlord.id, periodStart, periodEnd)
    landlordData.push({
      ...landlord,
      owed,
      totalCollected,
      totalPaidToLandlord,
      expectedRent: expectedRent || 0,
      collectionRate: collectionRate || 0,
      tenantCount: tenantCount || 0,
      paymentCount: paymentCount || 0,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landlord Payment Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Track landlord payments with collected rent and amounts owed. Integrated with rent collection data.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/landlords/reconciliation">
            <Button variant="outline" size="sm">
              Reconciliation
            </Button>
          </Link>
          <Link href="/api/landlords/payment-reminders" target="_blank">
            <Button variant="outline" size="sm">
              View Reminders
            </Button>
          </Link>
        </div>
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
                <div className="space-y-3">
                  {landlordsList.map((landlord) => (
                    <div key={landlord.id} className="p-4 border rounded-lg hover:bg-accent transition">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{landlord.name}</p>
                          <p className="text-sm text-muted-foreground">{landlord.email}</p>
                          <p className="text-sm text-muted-foreground">{landlord.phone}</p>
                          {landlord.tenantCount !== undefined && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {landlord.tenantCount} active tenant{landlord.tenantCount !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Expected Rent</p>
                          <p className="font-semibold text-sm">
                            UGX {Math.round(landlord.expectedRent || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Collected</p>
                          <p className="font-semibold">UGX {Math.round(landlord.totalCollected).toLocaleString()}</p>
                          {landlord.collectionRate !== undefined && (
                            <p className="text-xs mt-1">
                              <span className={landlord.collectionRate >= 90 ? "text-green-600" : landlord.collectionRate >= 70 ? "text-yellow-600" : "text-red-600"}>
                                {landlord.collectionRate.toFixed(1)}% collected
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Paid to Landlord</p>
                          <p className="font-semibold text-green-600">
                            UGX {Math.round(landlord.totalPaidToLandlord).toLocaleString()}
                          </p>
                          {landlord.paymentCount !== undefined && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {landlord.paymentCount} payment{landlord.paymentCount !== 1 ? "s" : ""} received
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Amount Owed</p>
                          <p className="font-bold text-lg text-red-600">
                            UGX {Math.round(landlord.owed).toLocaleString()}
                          </p>
                          {landlord.owed > 0 && (
                            <p className="text-xs text-red-600 mt-1">Payment pending</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Link href={`/landlords/${landlord.id}/payments`}>
                              <Button size="sm" variant="ghost">
                                History
                              </Button>
                            </Link>
                            <RecordPaymentDialog landlord={landlord} periodStart={periodStart} periodEnd={periodEnd} />
                          </div>
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
;("use client")

function RecordPaymentDialog({
  landlord,
  periodStart,
  periodEnd,
}: { landlord: LandlordWithPaymentInfo; periodStart: string; periodEnd: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(landlord.owed.toString())
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("landlord_id", landlord.id)
      formData.append("amount", amount)
      formData.append("payment_date", new Date().toISOString().split("T")[0])
      formData.append("payment_method", paymentMethod)
      formData.append("period_start", periodStart)
      formData.append("period_end", periodEnd)

      const result = await recordLandlordPayment(formData)

      if (result.success) {
        alert(`Payment recorded! Receipt: ${result.receipt_number}`)
        setOpen(false)
        window.location.reload()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment to {landlord.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="1"
              required
            />
          </div>
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Recording..." : "Record Payment"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
