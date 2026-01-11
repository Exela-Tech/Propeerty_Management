"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface AccountsPayable {
  id: string
  vendor_name: string
  invoice_number: string
  invoice_date: string
  due_date: string
  payment_terms: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  currency: string
  status: string
  description: string | null
}

export default function AccountsPayablePage() {
  const [invoices, setInvoices] = useState<AccountsPayable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/accounting/accounts-payable")
      const result = await response.json()
      if (result.success) {
        setInvoices(result.data)
      }
    } catch (error) {
      console.error("Failed to load invoices", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === "OPEN"
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      )
    }
    const badges: Record<string, React.JSX.Element> = {
      OPEN: <Badge variant="default">Open</Badge>,
      PARTIAL: <Badge variant="secondary">Partial</Badge>,
      PAID: <Badge variant="outline">Paid</Badge>,
      VOIDED: <Badge variant="secondary">Voided</Badge>,
    }
    return badges[status] || <Badge>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading accounts payable...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <span className="text-xl font-semibold">Accounts Payable</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system">
              <Button variant="ghost">Back to Accounting</Button>
            </Link>
            <Link href="/admin/accounting/system/accounts-payable/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Accounts Payable</h1>
            <p className="text-muted-foreground">Track vendor bills, landlord payables, and payment aging</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AP Invoices</CardTitle>
              <CardDescription>{invoices.length} total invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-semibold">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.vendor_name}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(new Date(invoice.due_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-mono">
                          {invoice.total_amount.toLocaleString()} {invoice.currency}
                        </TableCell>
                        <TableCell className="font-mono text-green-600">
                          {invoice.paid_amount.toLocaleString()} {invoice.currency}
                        </TableCell>
                        <TableCell className="font-mono font-semibold">
                          {invoice.balance_amount.toLocaleString()} {invoice.currency}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status, invoice.due_date)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
