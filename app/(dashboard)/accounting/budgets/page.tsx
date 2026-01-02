"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, TrendingUp, AlertCircle } from "lucide-react"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([
    {
      id: "1",
      name: "2025 Annual Budget",
      year: 2025,
      status: "active",
      totalBudgeted: 50000000,
      totalSpent: 12500000,
      lineItems: [
        { category: "Maintenance & Repairs", budgeted: 15000000, spent: 4200000 },
        { category: "Utilities", budgeted: 10000000, spent: 2100000 },
        { category: "Staffing", budgeted: 20000000, spent: 6200000 },
      ],
    },
    {
      id: "2",
      name: "January 2025 Budget",
      year: 2025,
      month: 1,
      status: "draft",
      totalBudgeted: 5000000,
      totalSpent: 1200000,
      lineItems: [
        { category: "Maintenance & Repairs", budgeted: 1500000, spent: 420000 },
        { category: "Utilities", budgeted: 1000000, spent: 210000 },
        { category: "Staffing", budgeted: 2000000, spent: 570000 },
      ],
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Create and monitor budgets with variance analysis</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Budget
        </Button>
      </div>

      <div className="grid gap-4">
        {budgets.map((budget) => {
          const percentageSpent = (budget.totalSpent / budget.totalBudgeted) * 100
          const isOverBudget = budget.totalSpent > budget.totalBudgeted

          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{budget.name}</CardTitle>
                    <CardDescription>{budget.month ? `January ${budget.year}` : `Year ${budget.year}`}</CardDescription>
                  </div>
                  <Badge variant={budget.status === "active" ? "default" : "secondary"}>{budget.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budgeted</p>
                    <p className="text-2xl font-bold">UGX {(budget.totalBudgeted / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                      UGX {(budget.totalSpent / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold">
                      UGX {((budget.totalBudgeted - budget.totalSpent) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Overall Budget Usage</p>
                    <p className="text-sm text-muted-foreground">{percentageSpent.toFixed(1)}%</p>
                  </div>
                  <Progress value={Math.min(percentageSpent, 100)} className="h-2" />
                  {isOverBudget && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">Budget exceeded</p>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div>
                  <p className="text-sm font-semibold mb-3">Budget Line Items</p>
                  <div className="space-y-3">
                    {budget.lineItems.map((item, idx) => {
                      const itemPercentage = (item.spent / item.budgeted) * 100
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">{item.category}</p>
                            <p className="text-xs text-muted-foreground">
                              {itemPercentage.toFixed(0)}% of UGX {(item.budgeted / 1000000).toFixed(1)}M
                            </p>
                          </div>
                          <Progress value={Math.min(itemPercentage, 100)} className="h-1.5" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Variance Analysis
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
