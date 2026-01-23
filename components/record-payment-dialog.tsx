"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { recordLandlordPayment } from "@/app/(dashboard)/landlords/payment-actions"
import { getBankAccounts } from "@/app/(dashboard)/accounting/actions"

interface LandlordWithPaymentInfo {
  id: string
  name: string
  email: string
  phone: string
  payment_due_day: number
  commission_percentage: number
  owed: number
  totalCollected: number
  totalPaidToLandlord: number
}

interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  currency: string
  current_balance: number
}

interface GroupedBankAccounts {
  asset?: BankAccount[]
  liability?: BankAccount[]
  equity?: BankAccount[]
  income?: BankAccount[]
  expense?: BankAccount[]
}

export function RecordPaymentDialog({
  landlord,
  periodStart,
  periodEnd,
}: { landlord: LandlordWithPaymentInfo; periodStart: string; periodEnd: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(landlord.owed.toString())
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [bankAccountId, setBankAccountId] = useState("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const loadAccounts = async () => {
      const accountsByType: GroupedBankAccounts = await getBankAccounts()

      const allAccounts: BankAccount[] = [
        ...(accountsByType.asset || []),
        ...(accountsByType.liability || []),
        ...(accountsByType.equity || []),
        ...(accountsByType.income || []),
        ...(accountsByType.expense || []),
      ]

      setBankAccounts(allAccounts)
      if (allAccounts.length > 0) {
        setBankAccountId(allAccounts[0].id)
      }
    }

    loadAccounts()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("landlord_id", landlord.id)
      formData.append("amount", amount)
      formData.append("payment_date", new Date().toISOString().split("T")[0])
      formData.append("payment_method", paymentMethod)
      formData.append("period_start", periodStart)
      formData.append("period_end", periodEnd)
      formData.append("bank_account_id", bankAccountId)

      const result = await recordLandlordPayment(formData)

      if (result.success) {
        alert(
          `Payment recorded!\n\nReceipt: ${result.receipt_number}\nGross: UGX ${result.grossAmount?.toLocaleString()}\nManagement Fee: UGX ${result.managementFee?.toLocaleString()}\nNet to Landlord: UGX ${result.netAmount?.toLocaleString()}`
        )
        setOpen(false)
        window.location.reload()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error(" Error:", error)
      alert("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment to {landlord.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Gross Amount (UGX)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          <div>
            <Label>Pay From Bank</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_name} ({account.currency}{" "}
                    {account.current_balance.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
