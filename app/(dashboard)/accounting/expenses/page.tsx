"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp } from "lucide-react"
import { getExpenseSummary, getExpenses } from "@/app/(dashboard)/accounting/expenses/actions"
import { formatCurrency } from "@/lib/utils"

export default function ExpenseManagementPage() {
  const [summary, setSummary] = useState({ totalExpenses: 0, categories: 0, pendingApproval: 0 })
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryData, expensesData] = await Promise.all([getExpenseSummary(), getExpenses()])
        setSummary(summaryData)
        setExpenses(expensesData)
      } catch (error) {
        console.error("Error loading expenses:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-gray-500 mt-2">Track, categorize, and analyze your expenses</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-xs text-gray-600 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.categories}</p>
            <p className="text-xs text-gray-600 mt-2">Active expense categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingApproval}</p>
            <p className="text-xs text-gray-600 mt-2">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <p className="font-medium">{expense.category}</p>
                    <p className="text-sm text-gray-600">{expense.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(expense.amount)}</p>
                    <p className={`text-sm ${expense.status === "approved" ? "text-green-600" : "text-yellow-600"}`}>
                      {expense.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No expenses recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
