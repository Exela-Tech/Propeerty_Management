import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, DollarSign, Receipt } from "lucide-react"
import Link from "next/link"
import { getLandlordPayments } from "../../payment-actions"
import { format } from "date-fns"

export default async function LandlordPaymentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get landlord info
  const { data: landlord } = await supabase.from("owners").select("*").eq("id", id).single()

  if (!landlord) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Landlord not found</p>
          <Link href="/landlords">
            <Button variant="outline" className="mt-4">
              Back to Landlords
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get payment history
  const payments = await getLandlordPayments(id)

  // Calculate totals
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalPayments = payments.length

  // Get payment method counts
  const paymentMethods = payments.reduce((acc, p) => {
    const method = p.payment_method || "unknown"
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      mobile_money: "Mobile Money",
    }
    return labels[method] || method
  }

  function getStatusBadge(status: string) {
    if (status === "completed") {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    }
    if (status === "pending") {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">{landlord.name}</p>
        </div>
        <Link href="/landlords/payments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment Schedule
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {Math.round(totalPaid).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cumulative total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Due Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {landlord.payment_due_day === 5
                ? "5th"
                : landlord.payment_due_day === 15
                  ? "15th"
                  : landlord.payment_due_day === 30
                    ? "30th (End)"
                    : `${landlord.payment_due_day}th`}
            </div>
            <p className="text-xs text-muted-foreground">Of each month</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Complete history of all payments made to this landlord</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payment history found</p>
              <Link href="/landlords/payments">
                <Button variant="outline" className="mt-4">
                  Record First Payment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.payment_date
                        ? format(new Date(payment.payment_date), "MMM dd, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{payment.receipt_number || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      UGX {Math.round(Number(payment.amount || 0)).toLocaleString()}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.payment_method || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.period_start && payment.period_end
                        ? `${format(new Date(payment.period_start), "MMM dd")} - ${format(new Date(payment.period_end), "MMM dd, yyyy")}`
                        : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status || "completed")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {payment.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/landlords/payments/${payment.id}/receipt`}>
                        <Button size="sm" variant="ghost">
                          View Receipt
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      {Object.keys(paymentMethods).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Breakdown of payment methods used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(paymentMethods).map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm">{getPaymentMethodLabel(method)}</span>
                  <Badge variant="outline">{count} payments</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
