"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface TrialBalanceAccount {
  account_id: string
  account_code: string
  account_name: string
  account_type: string
  debit_balance: number
  credit_balance: number
}

interface TrialBalance {
  as_of_date: string
  accounts: TrialBalanceAccount[]
  total_debits: number
  total_credits: number
  is_balanced: boolean
}

export default function TrialBalancePage() {
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    fetchTrialBalance()
  }, [asOfDate])

  const fetchTrialBalance = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/accounting/reports/trial-balance?as_of_date=${asOfDate}`)
      const result = await response.json()
      if (result.success) {
        setTrialBalance(result.data)
      }
    } catch (error) {
      console.error("Failed to load trial balance", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !trialBalance) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading trial balance...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">Trial Balance</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system">
              <Button variant="ghost">Back to Accounting</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Trial Balance</h1>
              <p className="text-muted-foreground">All account balances as of a specific date</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="as_of_date">As of Date</Label>
                <Input
                  id="as_of_date"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {trialBalance && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trial Balance Report</CardTitle>
                    <CardDescription>
                      As of {format(new Date(trialBalance.as_of_date), "MMMM dd, yyyy")}
                    </CardDescription>
                  </div>
                  {trialBalance.is_balanced ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Balanced
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Not Balanced
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Debit Balance</TableHead>
                      <TableHead className="text-right">Credit Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No accounts with balances found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {trialBalance.accounts.map((account) => (
                          <TableRow key={account.account_id}>
                            <TableCell className="font-mono font-semibold">{account.account_code}</TableCell>
                            <TableCell>{account.account_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{account.account_type}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {account.debit_balance > 0
                                ? `${account.debit_balance.toLocaleString()} UGX`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {account.credit_balance > 0
                                ? `${account.credit_balance.toLocaleString()} UGX`
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 font-bold">
                          <TableCell colSpan={3} className="text-right">
                            TOTALS:
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trialBalance.total_debits.toLocaleString()} UGX
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {trialBalance.total_credits.toLocaleString()} UGX
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
