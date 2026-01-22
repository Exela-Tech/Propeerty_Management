"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Users, Banknote } from "lucide-react"
import { recordLandlordPayment } from "@/app/(dashboard)/landlords/payment-actions"
import { getBankAccounts } from "@/app/(dashboard)/accounting/actions"

interface Property {
  id: string
  name: string
  location: string
  commission_type: "percentage" | "fixed"
  commission_value: number
  totalCollected: number
  expectedRent: number
  commissionAmount: number
  netPayable: number
  tenantCount: number
  paidToLandlord: number
  balance: number
}

interface BankAccount {
  id: string
  account_name: string
  bank_name: string
  currency: string
  current_balance: number
}

interface PropertyPaymentCardProps {
  property: Property
  landlordId: string
  landlordName: string
  periodStart: string
  periodEnd: string
}

export function PropertyPaymentCard({
  property,
  landlordId,
  landlordName,
  periodStart,
  periodEnd,
}: PropertyPaymentCardProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(property.balance.toString())
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [bankAccountId, setBankAccountId] = useState("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(false)

  // Calculate management fee based on entered amount
  const grossAmount = Number(amount) || 0
  const managementFee = property.commission_type === "fixed" 
    ? property.commission_value 
    : (grossAmount * property.commission_value) / 100
  const netToLandlord = grossAmount - managementFee

  const loadBankAccounts = async () => {
    const accounts = await getBankAccounts()
    // Flatten all account arrays from the returned object
    const allAccounts = Object.values(accounts).flat()
    const mappedAccounts: BankAccount[] = allAccounts.map((account: any) => ({
      id: account.id,
      account_name: account.account_name,
      bank_name: account.bank_name,
      currency: account.currency || "UGX",
      current_balance: account.current_balance || 0,
    }))
    setBankAccounts(mappedAccounts)
    if (mappedAccounts.length > 0) {
      setBankAccountId(mappedAccounts[0].id)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadBankAccounts()
      setAmount(property.balance.toString())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("landlord_id", landlordId)
      formData.append("property_id", property.id)
      formData.append("amount", amount)
      formData.append("payment_date", new Date().toISOString().split("T")[0])
      formData.append("payment_method", paymentMethod)
      formData.append("period_start", periodStart)
      formData.append("period_end", periodEnd)
      formData.append("bank_account_id", bankAccountId)

      const result = await recordLandlordPayment(formData)

      if (result.success) {
        const feeLabel = result.commissionType === "fixed"
          ? `Fixed Fee: UGX ${result.managementFee?.toLocaleString()}`
          : `Commission (${result.commissionValue}%): UGX ${result.managementFee?.toLocaleString()}`

        alert(
          `Payment recorded!\n\nReceipt: ${result.receipt_number}\nProperty: ${result.propertyName}\nGross: UGX ${result.grossAmount?.toLocaleString()}\n${feeLabel}\nNet to Landlord: UGX ${result.netAmount?.toLocaleString()}`
        )
        setOpen(false)
        window.location.reload()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      alert("Failed to record payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-primary/50">
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Property Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{property.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{property.location}</p>
            <div className="flex items-center gap-2 mt-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{property.tenantCount} tenant(s)</span>
            </div>
          </div>

          {/* Collected */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Collected</p>
            <p className="font-semibold text-green-600">UGX {property.totalCollected.toLocaleString()}</p>
          </div>

          {/* Commission */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Commission</p>
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {property.commission_type === "fixed" 
                ? `UGX ${property.commission_value.toLocaleString()}` 
                : `${property.commission_value}%`}
            </Badge>
            <p className="text-sm font-medium text-orange-600 mt-1">
              - UGX {Math.round(property.commissionAmount).toLocaleString()}
            </p>
          </div>

          {/* Net Payable */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Net Payable</p>
            <p className="font-semibold text-blue-600">UGX {Math.round(property.netPayable).toLocaleString()}</p>
          </div>

          {/* Balance */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p className={`font-bold text-lg ${property.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              UGX {Math.round(property.balance).toLocaleString()}
            </p>
            {property.paidToLandlord > 0 && (
              <p className="text-xs text-muted-foreground">
                (Paid: UGX {property.paidToLandlord.toLocaleString()})
              </p>
            )}
          </div>

          {/* Action */}
          <div className="text-right">
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  disabled={property.balance <= 0}
                  className={property.balance > 0 ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <Banknote className="h-4 w-4 mr-1" />
                  Pay
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pay {landlordName}</DialogTitle>
                  <p className="text-sm text-muted-foreground">Property: {property.name}</p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Commission Info */}
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Commission: {property.commission_type === "fixed" 
                        ? `Fixed UGX ${property.commission_value.toLocaleString()}` 
                        : `${property.commission_value}% of amount`}
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <Label htmlFor="amount">Gross Amount (UGX)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="1"
                      min="0"
                      required
                    />
                  </div>

                  {/* Breakdown */}
                  {grossAmount > 0 && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Gross Amount:</span>
                        <span className="font-medium">UGX {grossAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>
                          {property.commission_type === "fixed" ? "Fixed Fee:" : `Commission (${property.commission_value}%):`}
                        </span>
                        <span className="font-medium">- UGX {Math.round(managementFee).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2 text-green-600">
                        <span>Net to Landlord:</span>
                        <span>UGX {Math.round(netToLandlord).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Bank Account */}
                  <div>
                    <Label htmlFor="bank_account">Pay From Bank</Label>
                    <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bank account" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading || !bankAccountId || grossAmount <= 0} className="flex-1">
                      {loading ? "Processing..." : `Pay UGX ${Math.round(netToLandlord).toLocaleString()}`}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
