"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Filter, Download } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface GeneralLedgerEntry {
  id: string
  transaction_date: string
  account_id: string
  description: string
  reference_number: string | null
  debit_amount: number
  credit_amount: number
  running_balance: number
  currency: string
  status: string
  chart_of_accounts: {
    account_code: string
    account_name: string
    account_type: string
    normal_balance: string
  }
  journal_entries: {
    journal_number: string
    journal_type: string
    description: string
  } | null
}

interface Account {
  id: string
  account_code: string
  account_name: string
}

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    account_id: "",
    start_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
    period_month: "",
    period_year: new Date().getFullYear().toString(),
  })

  useEffect(() => {
    fetchAccounts()
    fetchEntries()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [filters])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounting/chart-of-accounts")
      const result = await response.json()
      if (result.success) {
        setAccounts(result.data.filter((acc: Account) => acc.is_active))
      }
    } catch (error) {
      console.error("Failed to load accounts", error)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.account_id) params.append("account_id", filters.account_id)
      if (filters.start_date) params.append("start_date", filters.start_date)
      if (filters.end_date) params.append("end_date", filters.end_date)
      if (filters.period_month) params.append("period_month", filters.period_month)
      if (filters.period_year) params.append("period_year", filters.period_year)

      const response = await fetch(`/api/accounting/general-ledger?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setEntries(result.data)
      }
    } catch (error) {
      console.error("Failed to load entries", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading general ledger...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">General Ledger</span>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold">General Ledger</h1>
            <p className="text-muted-foreground">View all posted transactions with running balances</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="account_id">Account</Label>
                  <Select
                    value={filters.account_id}
                    onValueChange={(value) => setFilters({ ...filters, account_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="period_year">Year</Label>
                  <Input
                    id="period_year"
                    type="number"
                    value={filters.period_year}
                    onChange={(e) => setFilters({ ...filters, period_year: e.target.value })}
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>General Ledger Entries</CardTitle>
                  <CardDescription>{entries.length} transactions found</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Journal</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.transaction_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono font-semibold">{entry.chart_of_accounts.account_code}</div>
                            <div className="text-sm text-muted-foreground">{entry.chart_of_accounts.account_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          {entry.journal_entries ? (
                            <Badge variant="outline">{entry.journal_entries.journal_number}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{entry.reference_number || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.debit_amount > 0 ? `${entry.debit_amount.toLocaleString()} ${entry.currency}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.credit_amount > 0 ? `${entry.credit_amount.toLocaleString()} ${entry.currency}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {entry.running_balance.toLocaleString()} {entry.currency}
                        </TableCell>
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
