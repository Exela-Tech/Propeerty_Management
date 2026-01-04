"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Lock, Unlock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface AccountingPeriod {
  id: string
  period_month: number
  period_year: number
  period_name: string
  start_date: string
  end_date: string
  is_locked: boolean
  locked_at: string | null
  locked_by: string | null
  notes: string | null
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPeriods()
  }, [])

  const fetchPeriods = async () => {
    try {
      const response = await fetch("/api/accounting/periods")
      const result = await response.json()
      if (result.success) {
        setPeriods(result.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load periods",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLock = async (periodId: string, isLocked: boolean) => {
    const action = isLocked ? "unlock" : "lock"
    if (!confirm(`Are you sure you want to ${action} this period?`)) return

    try {
      const response = await fetch("/api/accounting/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period_id: periodId,
          is_locked: !isLocked,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchPeriods()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update period",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update period",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading periods...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6" />
            <span className="text-xl font-semibold">Accounting Periods</span>
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
            <h1 className="text-3xl font-bold">Period Locking</h1>
            <p className="text-muted-foreground">Lock accounting periods to prevent modifications</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accounting Periods</CardTitle>
              <CardDescription>{periods.length} total periods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Locked At</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No periods found
                      </TableCell>
                    </TableRow>
                  ) : (
                    periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-semibold">{period.period_name}</TableCell>
                        <TableCell>{format(new Date(period.start_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(new Date(period.end_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {period.is_locked ? (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <Unlock className="h-3 w-3" />
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {period.locked_at ? format(new Date(period.locked_at), "MMM dd, yyyy HH:mm") : "-"}
                        </TableCell>
                        <TableCell>{period.notes || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleLock(period.id, period.is_locked)}
                          >
                            {period.is_locked ? (
                              <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Unlock
                              </>
                            ) : (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Lock
                              </>
                            )}
                          </Button>
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
