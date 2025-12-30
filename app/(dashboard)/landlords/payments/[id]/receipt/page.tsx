"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { numberToWords } from "@/lib/utils/number-to-words"

interface LandlordPaymentReceipt {
  id: string
  receipt_number: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  period_start: string
  period_end: string
  notes?: string
  landlord: {
    id: string
    name: string
    email: string
    phone: string
    address?: string
    city?: string
    payment_due_day: number
  }
  properties: Array<{
    id: string
    name: string
    address?: string
  }>
  tenantCount: number
  expectedRent: number
  totalRentCollected: number
  totalPreviousPayments: number
  amountOwed: number
  remainingBalance: number
}

export default function LandlordPaymentReceiptPage() {
  const params = useParams()
  const paymentId = params.id as string
  const [receipt, setReceipt] = useState<LandlordPaymentReceipt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReceipt() {
      try {
        const response = await fetch(`/api/landlords/payments/${paymentId}/receipt`)
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

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!receipt) return <div className="p-8">Receipt not found</div>

  const amountInWords = numberToWords(Math.floor(receipt.amount))
  const periodStart = new Date(receipt.period_start)
  const periodEnd = new Date(receipt.period_end)
  const paymentDate = new Date(receipt.payment_date)

  function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      check: "Check",
      mobile_money: "Mobile Money",
    }
    return labels[method] || method
  }

  function getDayLabel(day: number): string {
    if (day === 30) return "End of Month"
    if (day === 5) return "5th"
    if (day === 15) return "15th"
    return `${day}th`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="no-print mb-6 fixed top-4 right-4 flex gap-2 z-10">
        <Link href={`/landlords/${receipt.landlord.id}/payments`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="w-full max-w-2xl bg-white p-8 shadow-lg print:shadow-none print:bg-white">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">LANDLORD PAYMENT RECEIPT</h1>
          <p className="text-sm mt-2">Receipt #{receipt.receipt_number}</p>
          <div className="w-full h-px bg-black my-3"></div>
        </div>

        {/* Landlord Information */}
        <div className="space-y-4 mb-6">
          <div className="border-b border-dashed pb-4">
            <h2 className="font-bold text-lg mb-2">Landlord Information</h2>
            <p className="font-semibold">{receipt.landlord.name}</p>
            {receipt.landlord.email && <p className="text-sm text-gray-600">{receipt.landlord.email}</p>}
            {receipt.landlord.phone && <p className="text-sm text-gray-600">{receipt.landlord.phone}</p>}
            {receipt.landlord.address && (
              <p className="text-sm text-gray-600">
                {receipt.landlord.address}
                {receipt.landlord.city && `, ${receipt.landlord.city}`}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              Payment Due Day: {getDayLabel(receipt.landlord.payment_due_day)} of each month
            </p>
          </div>

          {/* Payment Details */}
          <div className="space-y-2 border-b border-dashed pb-4">
            <h2 className="font-bold text-lg mb-2">Payment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-semibold ml-2">{paymentDate.toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold ml-2 capitalize">
                  {getPaymentMethodLabel(receipt.payment_method)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Period:</span>
                <span className="font-semibold ml-2">
                  {periodStart.toLocaleDateString()} - {periodEnd.toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold ml-2 capitalize">{receipt.status}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-2 border-b border-dashed pb-4">
            <h2 className="font-bold text-lg mb-2">Financial Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Expected Rent (Period):</span>
                <span className="font-semibold">UGX {Math.round(receipt.expectedRent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Rent Collected:</span>
                <span className="font-semibold">UGX {Math.round(receipt.totalRentCollected).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Previous Payments (Period):</span>
                <span className="font-semibold">UGX {Math.round(receipt.totalPreviousPayments).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Owed:</span>
                <span className="font-semibold">UGX {Math.round(receipt.amountOwed).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold">Payment Amount:</span>
                <span className="font-bold text-lg">UGX {Math.round(receipt.amount).toLocaleString()}</span>
              </div>
              {receipt.remainingBalance > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remaining Balance:</span>
                  <span className="font-semibold">UGX {Math.round(receipt.remainingBalance).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Properties:</span>
              <span className="font-semibold ml-2">{receipt.properties.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Active Tenants:</span>
              <span className="font-semibold ml-2">{receipt.tenantCount}</span>
            </div>
            {receipt.notes && (
              <div className="text-sm mt-2">
                <span className="text-gray-600">Notes:</span>
                <p className="mt-1">{receipt.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border-t-2 border-dashed border-black pt-4 mt-6">
          <p className="text-sm">
            <span className="font-semibold">Amount in Words:</span> {amountInWords} Uganda Shillings Only
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-dashed text-center text-xs text-gray-600">
          <p>This is a computer-generated receipt.</p>
          <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
