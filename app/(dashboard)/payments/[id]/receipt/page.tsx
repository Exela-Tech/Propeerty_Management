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
  const paymentId = params.id as string
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    async function loadReceipt() {
      try {
        const response = await fetch(`/api/payments/${paymentId}/receipt`)
        if (!response.ok) throw new Error("Failed to load receipt")
        const data = await response.json()
        setReceipt(data)
      } catch (error) {
        console.error("Error loading receipt:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReceipt()
  }, [paymentId])

  if (loading) return <div className="p-8">Loading...</div>
  if (!receipt) return <div className="p-8">Receipt not found</div>

  const { tenant, property, unit } = receipt
  const amountInWords = numberToWords(Math.floor(receipt.amount))

  const formatPaymentBreakdown = () => {
    if (!receipt.paymentBreakdown || receipt.paymentBreakdown.length === 0) return "N/A"

    return receipt.paymentBreakdown
      .map((breakdown) => {
        const monthDate = new Date(breakdown.month + "-01")
        const monthStr = monthDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

        if (breakdown.type === "full_payment") {
          return `Rent for ${monthStr}`
        } else if (breakdown.type === "overpayment_credit") {
          return `Credit for ${monthStr} - Balance ${tenant.currency} ${Number(breakdown.amount).toLocaleString()}`
        } else {
          return `Partial payment on ${monthStr} balance ${tenant.currency} ${Number(breakdown.amount).toLocaleString()}`
        }
      })
      .join(" and ")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="no-print mb-6 fixed top-4 right-4 flex gap-2">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="w-80 bg-white p-0 shadow-lg print:shadow-none print:bg-white">
        <div className="p-4 text-center border-b-2 border-dashed border-black">
          <h1 className="text-lg font-bold tracking-tight uppercase">PAYMENT RECEIPT</h1>
          <p className="text-xs mt-1">Receipt #{receipt.receipt_number}</p>
          <div className="w-full h-px bg-black my-2"></div>
        </div>

        <div className="p-4 space-y-3 text-xs">
          {/* Tenant and Property Info */}
          <div className="border-b border-dashed pb-3">
            <p className="font-bold text-sm">
              {tenant.first_name} {tenant.last_name}
            </p>
            <p className="text-xs text-gray-600">{tenant.phone}</p>
            <p className="font-semibold mt-2 text-xs">
              {property?.name || "N/A"} - Room {unit?.room_number || unit?.unit_number || "N/A"}
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-2 border-b border-dashed pb-3">
            <div className="flex justify-between">
              <span>DATE:</span>
              <span className="font-semibold">{new Date(receipt.payment_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>PERIOD:</span>
              <span className="font-semibold">
                {receipt.payment_period
                  ? new Date(receipt.payment_period + "-01").toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    })
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>METHOD:</span>
              <span className="font-semibold capitalize">{receipt.payment_method?.replace("_", " ")}</span>
            </div>
          </div>

          {/* Payment For */}
          <div className="border-b border-dashed pb-3">
            <p className="font-semibold mb-1 uppercase">Being Payment For:</p>
            <p className="text-xs leading-tight">{formatPaymentBreakdown()}</p>
          </div>

          {/* Amount */}
          <div className="border-b border-dashed pb-3 space-y-2">
            <div>
              <p className="text-xs text-gray-600 uppercase">Amount in Words:</p>
              <p className="font-semibold text-xs uppercase">
                {amountInWords} {tenant.currency}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Amount Paid:</p>
              <p className="text-lg font-bold">
                {tenant.currency} {Number(receipt.amount || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600 uppercase">Outstanding Balance:</p>
              <p
                className={`text-lg font-bold ${Number(tenant.balanceAtPayment || 0) > 0 ? "text-red-600" : "text-green-600"}`}
              >
                {tenant.currency} {Number(tenant.balanceAtPayment || 0).toLocaleString()}
              </p>
            </div>
            {receipt.overpayment_credit > 0 && (
              <div className="bg-gray-50 p-2 rounded text-center border border-gray-200">
                <p className="text-xs font-semibold uppercase">Credit for Next Period:</p>
                <p className="font-bold text-blue-600">
                  {tenant.currency} {Number(receipt.overpayment_credit || 0).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-black p-4 text-center space-y-2">
          <p className="text-xs">Thank you for your payment</p>
          <div className="w-full h-px bg-black"></div>
          <p className="text-xs text-gray-600">{isClient ? new Date().toLocaleDateString() : ""}</p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .flex {
            display: flex;
          }
          .items-center {
            align-items: center;
          }
          .justify-center {
            justify-content: center;
          }
          .bg-gray-100 {
            background: white;
          }
          .w-80 {
            width: 80mm;
            margin: 0;
            box-shadow: none;
            page-break-after: avoid;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:bg-white {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
