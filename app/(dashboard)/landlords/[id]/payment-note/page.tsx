"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Link from "next/link"

interface Property {
  id: string
  name: string
}

interface TenantDetail {
  id: string
  number: number
  name: string
  unitNumber: string
  expectedAmount: number
}

interface Deduction {
  description: string
  amount: number
}

interface PaymentNoteData {
  landlord: {
    id: string
    name: string
  }
  property: {
    id: string
    name: string
  }
  month: string
  tenantDetails: TenantDetail[]
  totalExpectedRent: number
  deductions: Deduction[]
  totalDeductions: number
  netPayout: number
}

const CONTACT_INFO = {
  company: "EXELA REALTORS",
  phone: "0706392061",
}

export default function PaymentNotePage() {
  const params = useParams()
  const landlordId = params.id as string
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [data, setData] = useState<PaymentNoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7))
  const [notes, setNotes] = useState("")

  // Fetch properties on component mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch(`/api/landlords/${landlordId}/properties`)
        if (response.ok) {
          const result = await response.json()
          setProperties(result)
          if (result.length > 0) {
            setSelectedProperty(result[0].id)
          }
        }
      } catch (err) {
        console.error(" Error fetching properties:", err)
      }
    }

    if (landlordId) {
      fetchProperties()
    }
  }, [landlordId])

  // Fetch payment note when property or month changes
  useEffect(() => {
    async function fetchPaymentNote() {
      if (!selectedProperty) return

      try {
        const response = await fetch(
          `/api/landlords/${landlordId}/payment-note?propertyId=${selectedProperty}&month=${month}`,
        )
        if (!response.ok) throw new Error("Failed to fetch payment note")
        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error(" Error fetching payment note:", err)
      } finally {
        setLoading(false)
      }
    }

    if (selectedProperty) {
      setLoading(true)
      fetchPaymentNote()
    }
  }, [landlordId, selectedProperty, month])

  const formatCurrency = (amount: number): string => {
    return Math.round(amount).toLocaleString()
  }

  const handlePrint = () => {
    window.print()
  }

  const getMonthName = (monthStr: string): string => {
    const [year, monthNum] = monthStr.split("-")
    const date = new Date(Number(year), Number(monthNum) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Loading payment note...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <Link href={`/landlords/${landlordId}/payments`}>
          <Button variant="outline">Back to Payment History</Button>
        </Link>
        <div className="text-center py-12 text-red-600">Failed to load payment note</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Print Button Only */}
      <div className="flex justify-end mb-4 no-print">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Payment Note */}
      <div className="w-full max-w-3xl mx-auto bg-white p-8 print:max-w-full print:p-0">
        {/* Company Header */}
        <div className="text-center pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">{CONTACT_INFO.company}</h1>
          <p className="text-sm text-gray-600 mt-1">Contact: {CONTACT_INFO.phone}</p>

          {/* Payment Note Title */}
          <h2 className="text-lg font-bold uppercase mt-4">PAYMENT NOTE - {data.landlord.name.toUpperCase()}</h2>
          <p className="text-sm font-semibold text-gray-700 mt-2">Property: {data.property.name}</p>
        </div>

        {/* Separator line below header section */}
        <div className="border-b-2 border-black mb-6"></div>

        <div className="flex justify-center items-center gap-6 mb-6 no-print">
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Collection Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase mb-3">COLLECTION SUMMARY - {getMonthName(data.month)}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-black">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-black p-2 text-center w-8">#</th>
                  <th className="border border-black p-2 text-left">TENANT NAME</th>
                  <th className="border border-black p-2 text-right">AMOUNT (UGX)</th>
                </tr>
              </thead>
              <tbody>
                {data.tenantDetails.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="border border-black p-2 text-center font-semibold">{tenant.number}</td>
                    <td className="border border-black p-2">{tenant.name}</td>
                    <td className="border border-black p-2 text-right font-semibold">
                      {formatCurrency(tenant.expectedAmount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="border border-black p-2 text-right">
                    TOTAL:
                  </td>
                  <td className="border border-black p-2 text-right">{formatCurrency(data.totalExpectedRent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase mb-3">DEDUCTIONS</h3>
          <div className="space-y-2">
            {data.deductions.map((deduction, index) => (
              <div key={index} className="flex justify-between p-2 border-b border-gray-300">
                <span className="text-sm">
                  {index + 1}. {deduction.description}
                </span>
                <span className="text-sm font-semibold">{formatCurrency(deduction.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between p-2 border-t-2 border-black font-bold mt-2">
              <span className="text-sm">TOTAL DEDUCTIONS:</span>
              <span className="text-sm">{formatCurrency(data.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Payout Section */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-600 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-lg">NET PAYOUT TO LANDLORD:</span>
            <span className="text-2xl font-bold text-blue-700">UGX {formatCurrency(data.netPayout)}</span>
          </div>
        </div>

        {/* Notes and Approval */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-600">
              Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg text-xs h-16 no-print"
              placeholder="Add any notes here..."
            />
            {notes && <p className="mt-2 text-xs text-gray-700 p-2 bg-gray-50 rounded print:block hidden">{notes}</p>}
          </div>

          {/* Approval Signature Line */}
          <div className="mt-8 pt-6 border-t-2 border-black">
            <p className="text-xs font-semibold uppercase text-gray-600 mb-4">Approved By:</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs mb-8">_____________________________</p>
                <p className="text-xs font-semibold">Signature</p>
              </div>
              <div>
                <p className="text-xs mb-8">_____________________________</p>
                <p className="text-xs font-semibold">Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t-2 border-black pt-4 mt-8">
          <p className="text-xs text-gray-600">
            {CONTACT_INFO.company} | Phone: {CONTACT_INFO.phone}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          textarea {
            display: none !important;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .bg-gray-100 {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
