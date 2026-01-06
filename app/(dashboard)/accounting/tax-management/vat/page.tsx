"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function VATManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounting/tax-management">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">VAT Management</h1>
          <p className="text-gray-500">Track and manage 18% VAT on sales and purchases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">VAT Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">On sales/invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">VAT Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">On purchases/expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">VAT Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">To URA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VAT Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No VAT transactions recorded yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
