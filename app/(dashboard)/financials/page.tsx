"use client"

import { useEffect, useState } from "react"
import { getLandlordFinancials } from "./actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function FinancialsPage() {
  const [landlordFinancials, setLandlordFinancials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const landlords = await getLandlordFinancials()
        setLandlordFinancials(landlords)
      } catch (error) {
        console.error("Error loading financials:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  const totalRevenue = landlordFinancials.reduce((sum, l) => sum + l.totalMonthlyRent, 0)
  const totalCommission = landlordFinancials.reduce((sum, l) => sum + l.commission, 0)
  const totalLandlordPayouts = landlordFinancials.reduce((sum, l) => sum + l.landlordPayout, 0)
  const totalBalance = landlordFinancials.reduce((sum, l) => sum + l.totalBalance, 0)
  const totalPaid = landlordFinancials.reduce((sum, l) => sum + l.totalPaid, 0)
  const collectionRate = totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : 0

  // Prepare chart data
  const revenueDistribution = [
    { name: "Collected", value: totalPaid, color: "#10b981" },
    { name: "Outstanding", value: totalBalance, color: "#ef4444" },
  ]

  const landlordPayoutData = landlordFinancials.slice(0, 5).map((l) => ({
    name: l.landlord.name.split(" ")[0],
    payout: l.landlordPayout,
    commission: l.commission,
  }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor revenue, commissions, and landlord payouts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Collected Rent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-green-600">UGX {totalPaid.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">{collectionRate}% of expected revenue collected</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-red-600">UGX {totalBalance.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Unpaid rent across all properties</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-blue-600">UGX {totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total expected rent this month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Your Commission (10%)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-purple-600">UGX {totalCommission.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Management fees earned</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Landlord Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-amber-600">UGX {totalLandlordPayouts.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">To be paid to landlords</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Net Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-4xl font-bold text-cyan-600">UGX {totalCommission.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Your net profit this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `UGX ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Landlord Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={landlordPayoutData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `UGX ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="payout" fill="#8b5cf6" name="Payout" />
                <Bar dataKey="commission" fill="#10b981" name="Commission" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
