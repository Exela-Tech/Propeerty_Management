"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader } from "lucide-react"
import Link from "next/link"
import { updatePayment } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"

export default function EditPaymentPage() {
  const params = useParams()
  const paymentId = params.id as string
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}`)
        if (!response.ok) throw new Error("Failed to fetch payment")
        const data = await response.json()
        setPayment(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load payment",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [paymentId, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updatePayment(paymentId, formData)
      toast({
        title: "Success",
        description: "Payment updated successfully",
      })
      setTimeout(() => {
        window.location.href = "/payments"
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment",
        variant: "destructive",
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="p-8">
        <p className="text-destructive">Payment not found</p>
      </div>
    )
  }

  const paymentDate = payment.payment_date ? payment.payment_date.split("T")[0] : new Date().toISOString().split("T")[0]

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
          <CardTitle>Edit Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="0.01"
                defaultValue={payment.amount || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input type="date" id="payment_date" name="payment_date" required defaultValue={paymentDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select name="payment_method" required defaultValue={payment.payment_method}>
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
              {submitting ? "Updating..." : "Update Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
