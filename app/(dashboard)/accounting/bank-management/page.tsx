"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Edit } from "lucide-react"
import {
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  getBankTransactions,
  getChartOfAccountsForBanks,
} from "../actions"

export default function BankManagementPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [glAccounts, setGlAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false)
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    glAccountId: "",
    currency: "UGX",
    initialBalance: 0,
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [accounts, glAccts] = await Promise.all([getBankAccounts(), getChartOfAccountsForBanks()])
      setBankAccounts(accounts)
      setGlAccounts(glAccts)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBank = async () => {
    try {
      await createBankAccount(formData)
      setShowAddDialog(false)
      setFormData({
        accountName: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        glAccountId: "",
        currency: "UGX",
        initialBalance: 0,
        notes: "",
      })
      await loadData()
    } catch (error) {
      console.error("[v0] Error adding bank:", error)
    }
  }

  const handleEditBank = async () => {
    try {
      await updateBankAccount(selectedBank.id, {
        accountName: formData.accountName,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber,
        notes: formData.notes,
        isActive: selectedBank.is_active,
      })
      setShowEditDialog(false)
      await loadData()
    } catch (error) {
      console.error("[v0] Error updating bank:", error)
    }
  }

  const handleViewTransactions = async (bank: any) => {
    try {
      setSelectedBank(bank)
      const data = await getBankTransactions(bank.id)
      setTransactions(data.transactions)
      setShowTransactionsDialog(true)
    } catch (error) {
      console.error("[v0] Error loading transactions:", error)
    }
  }

  const openEditDialog = (bank: any) => {
    setSelectedBank(bank)
    setFormData({
      accountName: bank.account_name,
      bankName: bank.bank_name,
      accountNumber: bank.account_number || "",
      routingNumber: bank.routing_number || "",
      glAccountId: bank.gl_account_id,
      currency: bank.currency || "UGX",
      initialBalance: 0,
      notes: bank.notes || "",
    })
    setShowEditDialog(true)
  }

  if (loading) {
    return <div className="p-6">Loading bank accounts...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Management</h1>
          <p className="text-muted-foreground mt-1">Manage your bank accounts and deposit destinations</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., Exela Bank"
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="e.g., Operating Account"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label>Routing Number (Optional)</Label>
                  <Input
                    value={formData.routingNumber}
                    onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                    placeholder="987654321"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GL Account</Label>
                  <Select
                    value={formData.glAccountId}
                    onValueChange={(value) => setFormData({ ...formData, glAccountId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GL Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {glAccounts.map((acct) => (
                        <SelectItem key={acct.id} value={acct.id}>
                          {acct.account_code} - {acct.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Initial Balance (Optional)</Label>
                <Input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBank}>Add Bank Account</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bankAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{account.account_name}</CardTitle>
                <Badge variant="default">{account.bank_name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="text-lg font-mono">{account.account_number || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-lg font-semibold">{account.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={account.is_active ? "default" : "secondary"} className="mt-1">
                  {account.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => handleViewTransactions(account)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => openEditDialog(account)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Account
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bankAccounts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No bank accounts configured yet</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              Add Your First Bank Account
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Routing Number</Label>
                <Input
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditBank}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions - {selectedBank?.bank_name} ({selectedBank?.account_name})
            </DialogTitle>
          </DialogHeader>
          <div>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{new Date(txn.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-md">{txn.description}</TableCell>
                      <TableCell className="text-right">
                        {txn.debit > 0 ? `${txn.currency || "UGX"} ${txn.debit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.credit > 0 ? `${txn.currency || "UGX"} ${txn.credit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {txn.currency || "UGX"} {(txn.running_balance || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">No transactions found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
