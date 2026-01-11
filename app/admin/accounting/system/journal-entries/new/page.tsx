"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { FileText, Plus, Trash2, Save } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Account {
  id: string
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  is_active?: boolean
}

interface JournalLine {
  account_id: string
  description: string
  debit_amount: number
  credit_amount: number
  reference_number: string
}

export default function NewJournalEntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: "", description: "", debit_amount: 0, credit_amount: 0, reference_number: "" },
    { account_id: "", description: "", debit_amount: 0, credit_amount: 0, reference_number: "" },
  ])
  const [formData, setFormData] = useState({
    journal_type: "GENERAL",
    entry_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    notes: "",
    currency: "UGX",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounting/chart-of-accounts")
      const result = await response.json()
      if (result.success) {
        setAccounts(result.data.filter((acc: Account) => acc.is_active))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      })
    }
  }

  const addLine = () => {
    setLines([...lines, { account_id: "", description: "", debit_amount: 0, credit_amount: 0, reference_number: "" }])
  }

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index))
    }
  }

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    
    // If debit is entered, clear credit and vice versa
    if (field === "debit_amount" && typeof value === "number" && value > 0) {
      newLines[index].credit_amount = 0
    }
    if (field === "credit_amount" && typeof value === "number" && value > 0) {
      newLines[index].debit_amount = 0
    }
    
    setLines(newLines)
  }

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(String(line.debit_amount)) || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(String(line.credit_amount)) || 0), 0)
    return { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { isBalanced, totalDebit, totalCredit } = calculateTotals()
    
    if (!isBalanced) {
      toast({
        title: "Error",
        description: `Journal entry is not balanced. Debits: ${totalDebit.toFixed(2)}, Credits: ${totalCredit.toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    // Validate all lines have accounts
    const invalidLines = lines.filter((line) => !line.account_id || (!line.debit_amount && !line.credit_amount))
    if (invalidLines.length > 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for each line",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/accounting/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lines: lines.map((line) => ({
            account_id: line.account_id,
            description: line.description || formData.description,
            debit_amount: parseFloat(String(line.debit_amount)) || 0,
            credit_amount: parseFloat(String(line.credit_amount)) || 0,
            reference_number: line.reference_number || null,
          })),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Journal entry created successfully",
        })
        window.location.href = "/admin/accounting/system/journal-entries"
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create journal entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { totalDebit, totalCredit, isBalanced } = calculateTotals()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-semibold">New Journal Entry</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting/system/journal-entries">
              <Button variant="ghost">Back</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Journal Entry Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="journal_type">Journal Type *</Label>
                    <Select
                      value={formData.journal_type}
                      onValueChange={(value) => setFormData({ ...formData, journal_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General Journal</SelectItem>
                        <SelectItem value="SALES">Sales Journal</SelectItem>
                        <SelectItem value="PURCHASE">Purchase Journal</SelectItem>
                        <SelectItem value="CASH">Cash Journal</SelectItem>
                        <SelectItem value="PAYROLL">Payroll Journal</SelectItem>
                        <SelectItem value="CLOSING">Closing Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="entry_date">Entry Date *</Label>
                    <Input
                      id="entry_date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Brief description of the transaction"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Debits:</span>
                    <span className="font-mono">{totalDebit.toLocaleString()} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Credits:</span>
                    <span className="font-mono">{totalCredit.toLocaleString()} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between border-t pt-4">
                    <span className="font-semibold">Difference:</span>
                    <span className={`font-mono ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                      {(totalDebit - totalCredit).toLocaleString()} {formData.currency}
                    </span>
                  </div>
                  {!isBalanced && (
                    <p className="text-sm text-red-600">Journal entry must be balanced (debits = credits)</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Journal Entry Lines</CardTitle>
                    <CardDescription>Add debit and credit entries. Journal must be balanced.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addLine}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </div>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.account_id}
                            onValueChange={(value) => updateLine(index, "account_id", value)}
                            required
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(index, "description", e.target.value)}
                            placeholder="Line description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.debit_amount || ""}
                            onChange={(e) => updateLine(index, "debit_amount", parseFloat(e.target.value) || 0)}
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.credit_amount || ""}
                            onChange={(e) => updateLine(index, "credit_amount", parseFloat(e.target.value) || 0)}
                            className="text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.reference_number}
                            onChange={(e) => updateLine(index, "reference_number", e.target.value)}
                            placeholder="Ref #"
                          />
                        </TableCell>
                        <TableCell>
                          {lines.length > 2 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end gap-4">
              <Link href="/admin/accounting/system/journal-entries">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !isBalanced}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create Journal Entry"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
