"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Plus, Clock, CheckCircle } from "lucide-react"
import { getInvoiceSummary, getInvoices } from "@/app/(dashboard)/accounting/invoicing/actions"
import { formatCurrency } from "@/lib/utils"

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  amount: number
  status: string
}

interface InvoiceSummary {
  draft: number
  sent: number
  paid: number
  overdue: number
  cancelled: number
  totalRevenue: number
  pending?: number
}

export default function InvoicingPage() {
  const [summary, setSummary] = useState<InvoiceSummary>({ draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0, totalRevenue: 0 })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryData, invoicesData] = await Promise.all([getInvoiceSummary(), getInvoices()])
        setSummary(summaryData as InvoiceSummary)
        setInvoices(invoicesData as Invoice[])
      } catch (error) {
        console.error("Error loading invoices:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-gray-500 mt-2">Create and manage invoices for tenants and landlords</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.draft}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.pending ?? summary.sent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.paid}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading invoices...</p>
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{invoice.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-gray-600">{invoice.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No invoices created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500">No recurring invoices configured</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500">No overdue invoices</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
