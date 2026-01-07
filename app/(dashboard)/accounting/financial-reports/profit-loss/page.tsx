"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProfitAndLossStatement } from "../../actions"
import { formatCurrency } from "@/lib/utils"

export default function ProfitLossPage() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const handleGenerateReport = async () => {
    setIsLoading(true)
    try {
      const data = await getProfitAndLossStatement(startDate, endDate)
      setReport(data)
      console.log(" P&L Report:", data)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-gray-500">Income and expense summary for your business</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>P&L Summary</CardTitle>
            <p className="text-sm text-gray-500">
              {report.period.startDate} to {report.period.endDate}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm font-semibold text-gray-600">REVENUE</p>
                <div className="mt-2 space-y-2 text-sm">
                  {report.income && report.income.length > 0 ? (
                    report.income.map((item: any) => (
                      <div key={item.account_id} className="flex justify-between">
                        <span>{item.account_name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-gray-400">
                      <span>No income recorded</span>
                      <span>UGX 0</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(report.totalIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm font-semibold text-gray-600">EXPENSES</p>
                <div className="mt-2 space-y-2 text-sm">
                  {report.expenses && report.expenses.length > 0 ? (
                    report.expenses.map((item: any) => (
                      <div key={item.account_id} className="flex justify-between">
                        <span>{item.account_name}</span>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-gray-400">
                      <span>No expenses recorded</span>
                      <span>UGX 0</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(report.totalExpenses)}</span>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded ${report.netIncome >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Net Income</span>
                  <span className={`font-bold text-lg ${report.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(report.netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
