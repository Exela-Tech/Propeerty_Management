"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { numberToWords } from "@/lib/utils/number-to-words"

interface PaymentReceipt {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_period: string
  payment_method: string
  status: string
  overpayment_credit: number
  paymentBreakdown: Array<{
    month: string
    amount: number
    type: "full_payment" | "partial_payment" | "overpayment_credit"
  }>
  tenant: {
    first_name: string
    last_name: string
    email: string
    phone: string
    currency: string
    balance: number
    balanceAtPayment: number
    prepaid_balance: number
    monthly_rent: number
  }
  property: {
    name: string
  }
  unit: {
    unit_number: string
    room_number?: string
  }
}

export default function PaymentReceiptPage() {
  const params = useParams()

  // ✅ SAFE PARAM HANDLING (CRITICAL FIX)
  const paymentId =
    typeof params?.id === "string" ? params.id : null

  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // ✅ SAFE FETCH (WILL NOT RUN UNTIL ID EXISTS)
  useEffect(() => {
    if (!paymentId) return

    async function loadReceipt() {
      try {
        console.log("Loading receipt for payment ID:", paymentId)
        const url = `/api/payments/${paymentId}/receipt`
        console.log("Fetching from URL:", url)
        
        const response = await fetch(url)

        if (!response.ok) {
          const text = await response.text()
          console.error(
            "Receipt API error:",
            response.status,
            text,
            "URL:",
            url
          )
          throw new Error(`Failed to load receipt (${response.status}): ${text}`)
        }

        const result = await response.json()
        console.log("Receipt loaded successfully:", result)
        setReceipt(result.data)
      } catch (error) {
        console.error("Error loading receipt:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReceipt()
  }, [paymentId])

  // ---------------- UI STATES ----------------

  if (!paymentId) {
    return <div className="p-8">Preparing receipt...</div>
  }

  if (loading) {
    return <div className="p-8">Loading receipt...</div>
  }

  if (!receipt) {
    return <div className="p-8">Receipt not found</div>
  }

  // ---------------- DATA ----------------

  const { tenant, property, unit } = receipt
  const amountInWords = numberToWords(
    Math.floor(receipt.amount)
  )

  const formatPaymentBreakdown = () => {
    if (!receipt.paymentBreakdown?.length) return "N/A"

    return receipt.paymentBreakdown
      .map((b) => {
        const date = new Date(b.month + "-01")
        const month = date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        })

        if (b.type === "full_payment") {
          return `Rent for ${month}`
        }

        if (b.type === "partial_payment") {
          return `Partial rent for ${month} (${tenant.currency} ${b.amount.toLocaleString()})`
        }

        return `Credit for ${month} (${tenant.currency} ${b.amount.toLocaleString()})`
      })
      .join(" and ")
  }

  const handlePrint = () => window.print()

  // ---------------- UI ----------------

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Print Button */}
      <div className="no-print fixed top-4 right-4">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Receipt */}
      <div className="w-80 bg-white shadow-lg print:shadow-none">
        <div className="p-4 text-center border-b-2 border-dashed">
          <h1 className="font-bold uppercase">Payment Receipt</h1>
          <p className="text-xs">Receipt #{receipt.receipt_number}</p>
        </div>

        <div className="p-4 text-xs space-y-3">
          {/* Tenant */}
          <div className="border-b border-dashed pb-2">
            <p className="font-bold">
              {tenant.first_name} {tenant.last_name}
            </p>
            <p>{tenant.phone}</p>
            <p className="mt-1 font-semibold">
              {property?.name} — Unit{" "}
              {unit?.room_number || unit?.unit_number}
            </p>
          </div>

          {/* Payment Details */}
          <div className="border-b border-dashed pb-2 space-y-1">
            <div className="flex justify-between">
              <span>Date</span>
              <span>
                {new Date(receipt.payment_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Method</span>
              <span className="capitalize">
                {receipt.payment_method?.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Payment For */}
          <div className="border-b border-dashed pb-2">
            <p className="font-semibold">Being Payment For</p>
            <p>{formatPaymentBreakdown()}</p>
          </div>

          {/* Amount */}
          <div className="border-b border-dashed pb-2">
            <p className="uppercase text-gray-600">
              Amount in Words
            </p>
            <p className="font-semibold uppercase">
              {amountInWords} {tenant.currency}
            </p>
            <p className="text-lg font-bold">
              {tenant.currency}{" "}
              {receipt.amount.toLocaleString()}
            </p>
          </div>

          {/* Balance */}
          <div>
            <p className="uppercase text-gray-600">
              Outstanding Balance
            </p>
            <p
              className={`text-lg font-bold ${
                tenant.balanceAtPayment > 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {tenant.currency}{" "}
              {tenant.balanceAtPayment.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed p-4 text-center text-xs">
          <p>Thank you for your payment</p>
          {isClient && (
            <p className="text-gray-500">
              {new Date().toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
