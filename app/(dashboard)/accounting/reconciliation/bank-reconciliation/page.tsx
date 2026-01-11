"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getBankReconciliation } from "@/app/(dashboard)/accounting/actions"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface BankReconciliation {
  bankAccountId: string
  asOfDate: string
  glBalance: number
  bankBalance: number
  difference: number
  outstandingItems: Array<{
    id: string
    date: string
    description: string
    amount: number
    reconciled: boolean
  }>
}

export default function BankReconciliationPage() {
  const [reconciliation, setReconciliation] = useState<BankReconciliation | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Get bank account ID and date from props or state
        const bankAccountId = ""
        const asOfDate = new Date().toISOString().split("T")[0]
        if (bankAccountId) {
          const data = await getBankReconciliation(bankAccountId, asOfDate)
          setReconciliation(data)
        }
      } catch (error) {
        console.error("Error loading reconciliation:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading) return <p className="text-center py-8">Loading reconciliation data...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
        <p className="text-gray-500 mt-2">Match GL entries with bank statements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">GL Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(reconciliation?.glBalance || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bank Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(reconciliation?.bankBalance || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Difference</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${(reconciliation?.difference || 0) === 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(reconciliation?.difference || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliation?.outstandingItems?.map((item: { id: string; date: string; description: string; amount: number; reconciled: boolean }) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={item.reconciled ? "default" : "secondary"}>
                      {item.reconciled ? "Reconciled" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      {item.reconciled ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
