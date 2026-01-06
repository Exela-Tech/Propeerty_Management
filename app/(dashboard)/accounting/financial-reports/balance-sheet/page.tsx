"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getBalanceSheet } from "@/app/(dashboard)/accounting/actions"

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [balanceSheet, setBalanceSheet] = useState<any>(null)

  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      const data = await getBalanceSheet(asOfDate)
      setBalanceSheet(data)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!balanceSheet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/accounting/financial-reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Balance Sheet</h1>
            <p className="text-gray-500">Financial position as of a specific date</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">As Of Date</label>
              <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/accounting/financial-reports">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-gray-500">As of {balanceSheet.asOfDate}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">As Of Date</label>
            <Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ASSETS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-600">Assets</p>
              <div className="mt-2 space-y-1 text-sm">
                {balanceSheet.assets?.map((asset: any) => (
                  <div key={asset.id} className="flex justify-between">
                    <span>{asset.account_name}</span>
                    <span>{`UGX ${asset.current_balance.toLocaleString()}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-3 font-bold text-blue-600">
              <div className="flex justify-between">
                <span>TOTAL ASSETS</span>
                <span>{`UGX ${balanceSheet.totalAssets.toLocaleString()}`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LIABILITIES & EQUITY</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-600">Liabilities</p>
              <div className="mt-2 space-y-1 text-sm">
                {balanceSheet.liabilities?.map((liability: any) => (
                  <div key={liability.id} className="flex justify-between">
                    <span>{liability.account_name}</span>
                    <span>{`UGX ${liability.current_balance.toLocaleString()}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-gray-600">Equity</p>
              <div className="mt-2 space-y-1 text-sm">
                {balanceSheet.equity?.map((eq: any) => (
                  <div key={eq.id} className="flex justify-between">
                    <span>{eq.account_name}</span>
                    <span>{`UGX ${eq.current_balance.toLocaleString()}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-3 font-bold text-blue-600">
              <div className="flex justify-between">
                <span>TOTAL LIAB & EQUITY</span>
                <span>{`UGX ${balanceSheet.liabilitiesAndEquity.toLocaleString()}`}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
