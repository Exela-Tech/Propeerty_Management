import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Plus } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentActionButtons } from "./payment-action-buttons"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function loadPayments() {
  try {
    const supabase = getServiceClient()

    const { data: payments, error: paymentsError } = await supabase
      .from("tenant_payments")
      .select("*")
      .order("payment_date", { ascending: false })

    if (paymentsError) {
      console.error("Error loading payments:", paymentsError)
      return []
    }

    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, first_name, last_name, property_id, unit_id, currency")
    const { data: properties } = await supabase.from("properties").select("id, name")
    const { data: units } = await supabase.from("units").select("id, unit_number")

    const tenantsMap = new Map(tenants?.map((t) => [t.id, t]) || [])
    const propertiesMap = new Map(properties?.map((p) => [p.id, p]) || [])
    const unitsMap = new Map(units?.map((u) => [u.id, u]) || [])

    return (payments || []).map((payment) => {
      const tenant = tenantsMap.get(payment.tenant_id)
      const property = tenant ? propertiesMap.get(tenant.property_id) : null
      const unit = tenant ? unitsMap.get(tenant.unit_id) : null
      return {
        ...payment,
        tenant,
        property,
        unit,
      }
    })
  } catch (error) {
    console.error("Error in loadPayments:", error)
    return []
  }
}

export default async function PaymentsPage() {
  const payments = await loadPayments()

  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">Track all rent payments and transactions</p>
        </div>
        <Link href="/payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{payments.length} payment(s) recorded</p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payments recorded</h3>
            <p className="text-muted-foreground text-center">Payment history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/tenants/${payment.tenant_id}/statement`} className="text-blue-600 hover:underline">
                        {payment.tenant?.first_name} {payment.tenant?.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>{payment.property?.name || "N/A"}</TableCell>
                    <TableCell>{payment.unit?.unit_number || "N/A"}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace("_", " ")}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {payment.tenant?.currency || "UGX"} {Number(payment.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PaymentActionButtons paymentId={payment.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
