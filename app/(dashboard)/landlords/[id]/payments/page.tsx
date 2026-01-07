"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, DollarSign, TrendingUp, Percent } from "lucide-react"
import Link from "next/link"

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  period_start: string
  period_end: string
  receipt_number: string
  status: string
  notes: string | null
}

interface LandlordPaymentData {
  landlord: {
    id: string
    name: string
    email: string
    phone: string
    commission_percentage: number
  }
  payments: Payment[]
  totalPaid: number
  averagePayment: number
  lastPaymentDate: string | null
  paymentMethodBreakdown: Record<string, number>
  totalCollected: number
  expectedRentTotal: number
  totalCommissionDeducted: number
  netPayoutCalculated: number
}

export default function LandlordPaymentHistoryPage() {
  const params = useParams()
  const landlordId = params.id as string
  const [data, setData] = useState<LandlordPaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPaymentHistory() {
      try {
        const response = await fetch(`/api/landlords/${landlordId}/payments`)
        if (!response.ok) throw new Error("Failed to fetch payment history")
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error(" Error fetching payment history:", err)
        setError("Failed to load payment history")
      } finally {
        setLoading(false)
      }
    }

    if (landlordId) {
      fetchPaymentHistory()
    }
  }, [landlordId])

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center py-12">Loading payment history...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-8">
        <Link href="/landlords/payments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Payment Schedule
          </Button>
        </Link>
        <div className="text-center py-12 text-red-600">{error || "Failed to load payment history"}</div>
      </div>
    )
  }

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      mobile_money: "Mobile Money",
    }
    return labels[method] || method
  }

  const getPaymentMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      bank_transfer: "bg-blue-100 text-blue-800",
      cash: "bg-green-100 text-green-800",
      check: "bg-purple-100 text-purple-800",
      mobile_money: "bg-orange-100 text-orange-800",
    }
    return colors[method] || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number): string => {
    return `UGX ${Math.round(amount).toLocaleString()}`
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/landlords/payments">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold uppercase">{data.landlord.name}'S PAYMENT HISTORY</h1>
              <p className="text-muted-foreground mt-1">
                {data.landlord.email} • {data.landlord.phone}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/landlords/${landlordId}/payment-note`}>
            <Button variant="outline" size="icon" title="View Payment Note">
              <Download className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              EXPECTED RENT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.expectedRentTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">From active tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              COLLECTED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalCollected)}</p>
            <p className="text-xs text-muted-foreground mt-1">Actual payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-orange-600" />
              COMMISSION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalCommissionDeducted)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.landlord.commission_percentage}% of expected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              NET PAYOUT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.netPayoutCalculated)}</p>
            <p className="text-xs text-muted-foreground mt-1">After commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              TOTAL PAID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.payments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown Card */}
      <Card className="bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-orange-600" />
            COMMISSION BREAKDOWN
          </CardTitle>
          <CardDescription>
            Commission is calculated at {data.landlord.commission_percentage}% of EXPECTED rent from tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expected Rent</p>
              <p className="text-xl font-bold">{formatCurrency(data.expectedRentTotal)}</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
                <p className="text-2xl font-bold text-orange-600">{data.landlord.commission_percentage}%</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Amount Deducted</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(data.totalCommissionDeducted)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collections Status</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(data.totalCollected)} (
                {data.expectedRentTotal > 0 ? Math.round((data.totalCollected / data.expectedRentTotal) * 100) : 0}%)
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-200">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold">NET PAYOUT TO LANDLORD (after commission deduction)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.netPayoutCalculated)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>PAYMENT HISTORY</CardTitle>
          <CardDescription>Complete record of all payments made to this landlord</CardDescription>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No payments recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">RECEIPT</th>
                    <th className="text-left py-3 px-4 font-semibold">DATE</th>
                    <th className="text-left py-3 px-4 font-semibold">PERIOD</th>
                    <th className="text-left py-3 px-4 font-semibold">AMOUNT</th>
                    <th className="text-left py-3 px-4 font-semibold">METHOD</th>
                    <th className="text-left py-3 px-4 font-semibold">STATUS</th>
                    <th className="text-left py-3 px-4 font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-accent transition">
                      <td className="py-3 px-4 font-mono font-semibold">{payment.receipt_number}</td>
                      <td className="py-3 px-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(payment.period_start).toLocaleDateString()} -{" "}
                        {new Date(payment.period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getPaymentMethodColor(payment.payment_method)}>
                          {getPaymentMethodLabel(payment.payment_method)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/landlords/payments/${payment.id}/receipt`}>
                          <Button variant="outline" size="sm">
                            VIEW RECEIPT
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      {data.payments.some((p) => p.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>PAYMENT NOTES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.payments
                .filter((p) => p.notes)
                .map((payment) => (
                  <div key={payment.id} className="p-3 bg-accent rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{payment.receipt_number}</p>
                        <p className="text-sm text-muted-foreground">{payment.notes}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
