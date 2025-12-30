"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getTenants, recordPayment } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewPaymentPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [amount, setAmount] = useState<string>("") // added amount state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    getTenants().then((data) => {
      setTenants(data)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const result = await recordPayment(formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
      setTimeout(() => {
        window.location.href = "/payments"
      }, 1000)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to record payment",
        variant: "destructive",
      })
      setSubmitting(false)
    }
  }

  const handleTenantChange = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId)
    setSelectedTenant(tenant)
    setAmount(String(tenant?.monthly_rent || ""))
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payments
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select name="tenant_id" required onValueChange={handleTenantChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.first_name} {tenant.last_name} - {tenant.property?.name} (Unit {tenant.unit?.unit_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTenant && (
              <div className="rounded-lg bg-muted p-4 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Monthly Rent:</span> {selectedTenant.currency || "UGX"}{" "}
                  {Number(selectedTenant.monthly_rent || 0).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Due Day:</span> {selectedTenant.rent_due_day || "N/A"} of each month
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="1"
                placeholder="Enter payment amount"
                value={amount} // changed from defaultValue to value for proper state management
                onChange={(e) => setAmount(e.target.value)} // added onChange handler
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input type="date" id="payment_date" name="payment_date" required defaultValue={today} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_period">Payment Period (Month/Year) *</Label>
              <Input
                type="month"
                id="payment_period"
                name="payment_period"
                required
                defaultValue={new Date().toISOString().slice(0, 7)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select name="payment_method" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Recording..." : "Record Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
