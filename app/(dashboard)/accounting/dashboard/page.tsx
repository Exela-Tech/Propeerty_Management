"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { getAccountingDashboard } from "@/app/(dashboard)/accounting/actions"
import { formatCurrency } from "@/lib/utils"

export default function AccountingDashboardPage() {
  const [data, setData] = useState<{
    metrics: {
      totalIncome: number
      totalExpenses: number
      netProfit: number
      trustBalance: number
    }
    chartData: Array<{ month: string; income: number; expenses: number }>
    expensesByCategory: Array<{ category: string; amount: number }>
  }>({
    metrics: {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      trustBalance: 0,
    },
    chartData: [],
    expensesByCategory: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await getAccountingDashboard()
        setData(dashboardData)
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
        <p className="text-gray-500 mt-2">Real-time financial overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.metrics.totalIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.metrics.totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.metrics.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrency(data.metrics.netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trust Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.metrics.trustBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: string | number | (string | number)[]) => {
                    if (typeof value === 'number' || typeof value === 'string') {
                      return formatCurrency(Number(value))
                    }
                    return value
                  }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.expensesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value: string | number | (string | number)[]) => {
                    if (typeof value === 'number' || typeof value === 'string') {
                      return formatCurrency(Number(value))
                    }
                    return value
                  }} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
