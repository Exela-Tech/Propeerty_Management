"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import Link from "next/link"

interface ChartOfAccount {
  id: string
  account_code: string
  account_name: string
  account_type: string
  account_category: string | null
  parent_account_id: string | null
  level: number
  is_active: boolean
  is_system_account: boolean
  description: string | null
  normal_balance: string
  currency: string
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "",
    account_category: "",
    parent_account_id: "",
    description: "",
    normal_balance: "",
    currency: "UGX",
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounting/chart-of-accounts")
      const result = await response.json()
      if (result.success) {
        setAccounts(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load accounts",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingAccount
        ? `/api/accounting/chart-of-accounts/${editingAccount.id}`
        : "/api/accounting/chart-of-accounts"
      const method = editingAccount ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: editingAccount ? "Account updated successfully" : "Account created successfully",
        })
        setIsDialogOpen(false)
        resetForm()
        fetchAccounts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account)
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category || "",
      parent_account_id: account.parent_account_id || "",
      description: account.description || "",
      normal_balance: account.normal_balance,
      currency: account.currency,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return

    try {
      const response = await fetch(`/api/accounting/chart-of-accounts/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Account deleted successfully",
        })
        fetchAccounts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "",
      account_category: "",
      parent_account_id: "",
      description: "",
      normal_balance: "",
      currency: "UGX",
    })
    setEditingAccount(null)
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAccounts(newExpanded)
  }

  const getChildAccounts = (parentId: string) => {
    return accounts.filter((acc) => acc.parent_account_id === parentId)
  }

  const getRootAccounts = () => {
    return accounts.filter((acc) => !acc.parent_account_id)
  }

  const renderAccountRow = (account: ChartOfAccount, depth: number = 0) => {
    const children = getChildAccounts(account.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedAccounts.has(account.id)

    return (
      <React.Fragment key={account.id}>
        <TableRow>
          <TableCell style={{ paddingLeft: `${depth * 24 + 12}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => toggleExpand(account.id)} className="hover:bg-accent rounded p-1">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-6" />
              )}
              <span className="font-mono font-semibold">{account.account_code}</span>
            </div>
          </TableCell>
          <TableCell>{account.account_name}</TableCell>
          <TableCell>
            <Badge variant={account.account_type === "ASSET" || account.account_type === "EXPENSE" ? "default" : "secondary"}>
              {account.account_type}
            </Badge>
          </TableCell>
          <TableCell>{account.account_category || "-"}</TableCell>
          <TableCell>
            <Badge variant={account.normal_balance === "ASSET" || account.normal_balance === "EXPENSE" ? "default" : "outline"}>
              {account.normal_balance === "ASSET" || account.normal_balance === "EXPENSE" ? "DEBIT" : "CREDIT"}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant={account.is_active ? "default" : "secondary"}>
              {account.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>
            {account.is_system_account && <Badge variant="outline">System</Badge>}
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(account)} disabled={account.is_system_account}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(account.id)}
                disabled={account.is_system_account}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && children.map((child) => renderAccountRow(child, depth + 1))}
      </React.Fragment>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading accounts...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-semibold">Chart of Accounts</span>
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
              <h1 className="text-3xl font-bold">Chart of Accounts</h1>
              <p className="text-muted-foreground">Manage your hierarchical account structure</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle>
                  <DialogDescription>
                    {editingAccount ? "Update account details" : "Create a new account in the chart of accounts"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_code">Account Code *</Label>
                      <Input
                        id="account_code"
                        value={formData.account_code}
                        onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                        required
                        disabled={!!editingAccount}
                        placeholder="e.g., 1000, 2000-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_name">Account Name *</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="account_type">Account Type *</Label>
                      <Select
                        value={formData.account_type}
                        onValueChange={(value) => {
                          setFormData({ ...formData, account_type: value, normal_balance: value })
                        }}
                        required
                        disabled={!!editingAccount}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ASSET">Asset</SelectItem>
                          <SelectItem value="LIABILITY">Liability</SelectItem>
                          <SelectItem value="EQUITY">Equity</SelectItem>
                          <SelectItem value="REVENUE">Revenue</SelectItem>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="account_category">Account Category</Label>
                      <Select
                        value={formData.account_category}
                        onValueChange={(value) => setFormData({ ...formData, account_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CURRENT_ASSET">Current Asset</SelectItem>
                          <SelectItem value="FIXED_ASSET">Fixed Asset</SelectItem>
                          <SelectItem value="BANK_ACCOUNT">Bank Account</SelectItem>
                          <SelectItem value="TRUST_ACCOUNT">Trust Account</SelectItem>
                          <SelectItem value="CURRENT_LIABILITY">Current Liability</SelectItem>
                          <SelectItem value="TRUST_LIABILITY">Trust Liability</SelectItem>
                          <SelectItem value="ACCOUNTS_PAYABLE">Accounts Payable</SelectItem>
                          <SelectItem value="OWNERS_EQUITY">Owners Equity</SelectItem>
                          <SelectItem value="OPERATING_REVENUE">Operating Revenue</SelectItem>
                          <SelectItem value="MANAGEMENT_FEE_INCOME">Management Fee Income</SelectItem>
                          <SelectItem value="OPERATING_EXPENSE">Operating Expense</SelectItem>
                          <SelectItem value="MAINTENANCE_EXPENSE">Maintenance Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="parent_account_id">Parent Account</Label>
                    <Select
                      value={formData.parent_account_id}
                      onValueChange={(value) => setFormData({ ...formData, parent_account_id: value })}
                      disabled={!!editingAccount}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent account (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Root Account)</SelectItem>
                        {accounts
                          .filter((acc) => acc.id !== editingAccount?.id)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.account_code} - {acc.account_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingAccount ? "Update" : "Create"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>{accounts.length} total accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Normal Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>System</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getRootAccounts().map((account) => renderAccountRow(account))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
