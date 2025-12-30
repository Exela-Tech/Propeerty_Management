"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Printer } from "lucide-react"
import Link from "next/link"

interface TenantStatement {
  tenant: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    monthly_rent: number
    balance: number
    total_paid: number
    currency: string
    status: string
    lease_start_date: string
    lease_end_date: string
  }
  payments: Array<{
    id: string
    amount: number
    payment_date: string
    payment_method: string
    status: string
  }>
  property: {
    name: string
    address: string
  }
  unit: {
    unit_number: string
  }
}

export default function TenantStatementPage() {
  const params = useParams()
  const tenantId = params.id as string
  const [statement, setStatement] = useState<TenantStatement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStatement() {
      try {
        const response = await fetch(`/api/tenants/${tenantId}/statement`)
        if (!response.ok) throw new Error("Failed to load statement")
        const data = await response.json()
        setStatement(data)
      } catch (error) {
        console.error("Error loading statement:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStatement()
  }, [tenantId])

  if (loading) return <div className="p-8">Loading...</div>
  if (!statement) return <div className="p-8">Statement not found</div>

  const { tenant, payments, property, unit } = statement
  const totalDue = (Number(tenant.monthly_rent) || 0) - (Number(tenant.total_paid) || 0)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between no-print">
        <h1 className="text-3xl font-bold uppercase">PAYMENT STATEMENT</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="uppercase">TENANT INFORMATION</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">NAME</p>
            <p className="font-semibold">
              {tenant.first_name} {tenant.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">EMAIL</p>
            <p className="font-semibold">{tenant.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">PROPERTY</p>
            <p className="font-semibold">{property?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">UNIT</p>
            <p className="font-semibold">{unit?.unit_number || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">STATUS</p>
            <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">PHONE</p>
            <p className="font-semibold">{tenant.phone}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase">MONTHLY RENT</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {tenant.currency} {Number(tenant.monthly_rent || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase">TOTAL PAID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {tenant.currency} {Number(tenant.total_paid || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase">BALANCE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${Number(tenant.balance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
              {tenant.currency} {Number(tenant.balance || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase">LEASE PERIOD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">
              {new Date(tenant.lease_start_date).toLocaleDateString()} -{" "}
              {tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : "Ongoing"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="uppercase">PAYMENT HISTORY</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase">Date</TableHead>
                <TableHead className="uppercase">Amount</TableHead>
                <TableHead className="uppercase">Method</TableHead>
                <TableHead className="uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No payments recorded
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-semibold">
                      {tenant.currency} {Number(payment.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace("_", " ")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                        <Link
                          href={`/payments/${payment.id}/receipt`}
                          className="text-blue-600 hover:underline text-sm no-print"
                        >
                          View Receipt
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          /* Hide IDs from table rows when printing */
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
