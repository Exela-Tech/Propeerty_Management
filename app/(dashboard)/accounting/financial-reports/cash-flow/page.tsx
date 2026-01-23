"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getCashFlowStatement } from "@/app/(dashboard)/accounting/actions"
import { formatCurrency } from "@/lib/utils"

type CashFlowData = {
  period: { startDate: string; endDate: string }
  operatingActivities: number
  investingActivities: number
  financingActivities: number
  netCashFlow: number
}

export default function CashFlowPage() {
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const today = new Date()
        const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
        const endDate = today.toISOString().split('T')[0]
        const data = await getCashFlowStatement(startDate, endDate)
        setCashFlow(data)
      } catch (error) {
        console.error("Error loading cash flow:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading || !cashFlow) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
          <p className="text-gray-500 mt-2">Track cash movement across your business</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Loading cash flow data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use the data from API response
  const operatingInflow = cashFlow.operatingActivities > 0 ? cashFlow.operatingActivities : 0
  const operatingOutflow = cashFlow.operatingActivities < 0 ? Math.abs(cashFlow.operatingActivities) : 0

  const chartData = [
    {
      name: "Operating",
      inflow: operatingInflow,
      outflow: operatingOutflow,
    },
    {
      name: "Investing",
      inflow: 0,
      outflow: 0,
    },
    {
      name: "Financing",
      inflow: 0,
      outflow: 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
        <p className="text-gray-500 mt-2">Track cash movement across your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Operating Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(operatingInflow - operatingOutflow)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Investing Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ending Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(operatingInflow - operatingOutflow)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: string | number | (string | number)[]) => {
                if (typeof value === 'number' || typeof value === 'string') {
                  return formatCurrency(Number(value))
                }
                return value
              }} />
              <Legend />
              <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
              <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
