"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PAYEManagementPage() {
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
          <h1 className="text-3xl font-bold">PAYE Tax Management</h1>
          <p className="text-gray-500">Track and manage employee income tax deductions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PAYE Deducted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">From employee salaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PAYE Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">To URA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">PAYE Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">UGX 0</p>
            <p className="text-xs text-gray-600 mt-1">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PAYE Tax Brackets (Uganda)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between pb-2 border-b">
              <span>0 - 585,000</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span>585,001 - 1,410,000</span>
              <span className="font-medium">10%</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span>1,410,001 - 2,000,000</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="flex justify-between pb-2 border-b">
              <span>2,000,001 - 3,000,000</span>
              <span className="font-medium">30%</span>
            </div>
            <div className="flex justify-between">
              <span>3,000,001+</span>
              <span className="font-medium">35%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
