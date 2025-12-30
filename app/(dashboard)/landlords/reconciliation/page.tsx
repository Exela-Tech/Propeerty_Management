import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Download, DollarSign } from "lucide-react"
import Link from "next/link"
import { calculateLandlordOwed } from "../payment-actions"
import { format } from "date-fns"

export default async function LandlordReconciliationPage() {
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

  // Get all landlords
  const { data: landlords, error: landlordsError } = await supabase
    .from("owners")
    .select("id, name, email, phone, payment_due_day")
    .order("name", { ascending: true })

  if (landlordsError) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load landlords</p>
        </div>
      </div>
    )
  }

  // Calculate current month period
  const today = new Date()
  const currentMonth = today.toISOString().substring(0, 7)
  const [year, month] = currentMonth.split("-")
  const periodStart = `${year}-${month}-01`
  const periodEnd = `${year}-${month}-${new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()}`

  // Get reconciliation data for each landlord
  const reconciliationData = []
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

    // Get all payments to landlord in this period
    const { data: payments } = await supabase
      .from("landlord_payments")
      .select("id, amount, payment_date, receipt_number, status")
      .eq("landlord_id", landlord.id)
      .gte("payment_date", periodStart)
      .lte("payment_date", periodEnd)
      .order("payment_date", { ascending: false })

    reconciliationData.push({
      landlord,
      owed,
      totalCollected,
      totalPaidToLandlord,
      expectedRent,
      collectionRate,
      tenantCount,
      paymentCount,
      payments: payments || [],
      reconciled: owed === 0 && totalCollected > 0,
    })
  }

  const totalExpected = reconciliationData.reduce((sum, d) => sum + d.expectedRent, 0)
  const totalCollected = reconciliationData.reduce((sum, d) => sum + d.totalCollected, 0)
  const totalPaid = reconciliationData.reduce((sum, d) => sum + d.totalPaidToLandlord, 0)
  const totalOwed = reconciliationData.reduce((sum, d) => sum + d.owed, 0)
  const reconciledCount = reconciliationData.filter((d) => d.reconciled).length

  function getReconciliationStatus(reconciled: boolean, owed: number, collected: number) {
    if (reconciled) {
      return { status: "reconciled", label: "Reconciled", color: "bg-green-100 text-green-800", icon: CheckCircle2 }
    }
    if (owed > 0 && collected > 0) {
      return {
        status: "pending",
        label: "Pending Payment",
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      }
    }
    if (collected === 0) {
      return { status: "no_collection", label: "No Collection", color: "bg-gray-100 text-gray-800", icon: XCircle }
    }
    return { status: "unreconciled", label: "Unreconciled", color: "bg-red-100 text-red-800", icon: XCircle }
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
          <p className="text-muted-foreground mt-1">
            Reconcile rent collection with landlord payments for {format(new Date(periodStart), "MMMM yyyy")}
          </p>
        </div>
        <Link href="/landlords/payments">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment Schedule
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {Math.round(totalExpected).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total expected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {Math.round(totalCollected).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalExpected > 0 ? `${Math.round((totalCollected / totalExpected) * 100)}% collection rate` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid to Landlords</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {Math.round(totalPaid).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalCollected > 0 ? `${Math.round((totalPaid / totalCollected) * 100)}% paid out` : "N/A"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">UGX {Math.round(totalOwed).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {reconciledCount} of {reconciliationData.length} reconciled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Landlord Reconciliation</CardTitle>
          <CardDescription>Detailed reconciliation for each landlord</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Owed</TableHead>
                <TableHead>Collection Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliationData.map((data) => {
                const status = getReconciliationStatus(data.reconciled, data.owed, data.totalCollected)
                const StatusIcon = status.icon

                return (
                  <TableRow key={data.landlord.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{data.landlord.name}</p>
                        <p className="text-xs text-muted-foreground">{data.tenantCount} tenants</p>
                      </div>
                    </TableCell>
                    <TableCell>UGX {Math.round(data.expectedRent).toLocaleString()}</TableCell>
                    <TableCell>UGX {Math.round(data.totalCollected).toLocaleString()}</TableCell>
                    <TableCell>UGX {Math.round(data.totalPaidToLandlord).toLocaleString()}</TableCell>
                    <TableCell className={data.owed > 0 ? "font-semibold text-red-600" : ""}>
                      UGX {Math.round(data.owed).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          data.collectionRate >= 90
                            ? "text-green-600"
                            : data.collectionRate >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                        }
                      >
                        {data.collectionRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/landlords/${data.landlord.id}/payments`}>
                          <Button size="sm" variant="ghost">
                            History
                          </Button>
                        </Link>
                        {data.owed > 0 && (
                          <Link href="/landlords/payments">
                            <Button size="sm" variant="outline">
                              Pay Now
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
