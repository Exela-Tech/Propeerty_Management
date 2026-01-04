"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { use } from "react"

interface JournalEntryLine {
  id: string
  account_id: string
  description: string
  debit_amount: number
  credit_amount: number
  reference_number: string | null
  chart_of_accounts: {
    account_code: string
    account_name: string
  }
}

interface JournalEntry {
  id: string
  journal_number: string
  journal_type: string
  entry_date: string
  description: string
  total_debit: number
  total_credit: number
  currency: string
  status: string
  notes: string | null
  journal_entry_lines: JournalEntryLine[]
}

export default function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEntry()
  }, [id])

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/accounting/journal-entries/${id}`)
      const result = await response.json()
      if (result.success) {
        setEntry(result.data)
      }
    } catch (error) {
      console.error("Failed to load journal entry", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading journal entry...</p>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Journal entry not found</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">Journal Entry Details</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system/journal-entries">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Journal Entry Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Journal Number</p>
                <p className="font-mono font-semibold">{entry.journal_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">{entry.journal_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entry Date</p>
                <p>{format(new Date(entry.entry_date), "MMMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={entry.status === "POSTED" ? "default" : "secondary"}>{entry.status}</Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{entry.description}</p>
              </div>
              {entry.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{entry.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journal Entry Lines</CardTitle>
              <CardDescription>
                Total Debits: {entry.total_debit.toLocaleString()} {entry.currency} | Total Credits:{" "}
                {entry.total_credit.toLocaleString()} {entry.currency}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.journal_entry_lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <div className="font-mono font-semibold">{line.chart_of_accounts.account_code}</div>
                          <div className="text-sm text-muted-foreground">{line.chart_of_accounts.account_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {line.debit_amount > 0 ? `${line.debit_amount.toLocaleString()} ${entry.currency}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.credit_amount > 0 ? `${line.credit_amount.toLocaleString()} ${entry.currency}` : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{line.reference_number || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
