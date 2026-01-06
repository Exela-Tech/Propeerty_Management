"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Filter } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface LandlordLedgerEntry {
  id: string
  landlord_id: string
  transaction_date: string
  transaction_type: string
  description: string
  rent_collected: number
  expenses_paid: number
  management_fee_charged: number
  payout_amount: number
  running_balance: number
  currency: string
  owners: {
    id: string
    name: string
    email: string
  }
}

interface Landlord {
  id: string
  name: string
  email: string
}

export default function LandlordLedgersPage() {
  const [entries, setEntries] = useState<LandlordLedgerEntry[]>([])
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    landlord_id: "",
    start_date: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    end_date: format(new Date(), "yyyy-MM-dd"),
  })

  useEffect(() => {
    fetchLandlords()
    fetchEntries()
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [filters])

  const fetchLandlords = async () => {
    try {
      const response = await fetch("/api/landlords")
      const result = await response.json()
      if (result.success) {
        setLandlords(result.data)
      }
    } catch (error) {
      console.error("Failed to load landlords", error)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.landlord_id) params.append("landlord_id", filters.landlord_id)
      if (filters.start_date) params.append("start_date", filters.start_date)
      if (filters.end_date) params.append("end_date", filters.end_date)

      const response = await fetch(`/api/accounting/landlord-ledgers?${params.toString()}`)
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

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      RENT_COLLECTED: "Rent Collected",
      EXPENSE_PAID: "Expense Paid",
      FEE_CHARGED: "Management Fee",
      PAYOUT: "Payout to Landlord",
    }
    return labels[type] || type
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading landlord ledgers...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <span className="text-xl font-semibold">Landlord Sub-ledgers</span>
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
            <h1 className="text-3xl font-bold">Landlord Sub-ledgers</h1>
            <p className="text-muted-foreground">
              Individual accounting for each landlord showing rent collected, expenses, fees, and payouts
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="landlord_id">Landlord</Label>
                  <Select
                    value={filters.landlord_id}
                    onValueChange={(value) => setFilters({ ...filters, landlord_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All landlords" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Landlords</SelectItem>
                      {landlords.map((landlord) => (
                        <SelectItem key={landlord.id} value={landlord.id}>
                          {landlord.name}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Landlord Sub-ledger Entries</CardTitle>
              <CardDescription>{entries.length} transactions found</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Rent Collected</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Fees</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.transaction_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{entry.owners.name}</div>
                            <div className="text-sm text-muted-foreground">{entry.owners.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTransactionTypeLabel(entry.transaction_type)}</Badge>
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {entry.rent_collected > 0 ? `${entry.rent_collected.toLocaleString()} ${entry.currency}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {entry.expenses_paid > 0 ? `${entry.expenses_paid.toLocaleString()} ${entry.currency}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          {entry.management_fee_charged > 0
                            ? `${entry.management_fee_charged.toLocaleString()} ${entry.currency}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {entry.payout_amount > 0 ? `${entry.payout_amount.toLocaleString()} ${entry.currency}` : "-"}
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
