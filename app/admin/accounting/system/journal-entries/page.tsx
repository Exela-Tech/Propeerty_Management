"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileText, Plus, CheckCircle2, XCircle, Eye } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

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
  period_month: number
  period_year: number
  created_at: string
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/accounting/journal-entries")
      const result = await response.json()
      if (result.success) {
        setEntries(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load journal entries",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (id: string) => {
    if (!confirm("Are you sure you want to post this journal entry? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/accounting/journal-entries/${id}/post`, {
        method: "POST",
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Journal entry posted successfully",
        })
        fetchEntries()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to post journal entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post journal entry",
        variant: "destructive",
      })
    }
  }

  const getJournalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GENERAL: "General Journal",
      SALES: "Sales Journal",
      PURCHASE: "Purchase Journal",
      CASH: "Cash Journal",
      PAYROLL: "Payroll Journal",
      CLOSING: "Closing Entry",
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading journal entries...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">Journal Entries</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system">
              <Button variant="ghost">Back to Accounting</Button>
            </Link>
            <Link href="/admin/accounting/system/journal-entries/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Journal Entry
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Journal Entries</h1>
            <p className="text-muted-foreground">View and manage all journal entries</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Journal Entries</CardTitle>
              <CardDescription>{entries.length} total entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Journal #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No journal entries found
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono font-semibold">{entry.journal_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getJournalTypeLabel(entry.journal_type)}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(entry.entry_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.total_debit.toLocaleString()} {entry.currency}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.total_credit.toLocaleString()} {entry.currency}
                        </TableCell>
                        <TableCell>
                          {entry.status === "POSTED" ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Posted
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Draft
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.period_month}/{entry.period_year}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/accounting/system/journal-entries/${entry.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {entry.status === "DRAFT" && (
                              <Button variant="ghost" size="sm" onClick={() => handlePost(entry.id)}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
