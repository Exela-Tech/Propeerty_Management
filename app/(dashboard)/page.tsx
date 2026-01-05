"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, TrendingUp, AlertCircle, PieChart } from "lucide-react"
import { logger } from "@/lib/logger"

const log = logger.child("dashboard:page")
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DashboardStats {
  totalProperties: number
  activeProperties: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  maintenanceUnits: number
  occupancyRate: number
  rentCollectedThisMonth: number
  outstandingBalance: number
  delayedPayments: number
  incomeExpenseData: Array<{ month: string; income: number; expense: number }>
  revenueTrendData: Array<{ month: string; collected: number; outstanding: number }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: "no-store",
        })
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        log.error("Failed to fetch dashboard stats", error)
        setStats({
          totalProperties: 0,
          activeProperties: 0,
          totalUnits: 0,
          occupiedUnits: 0,
          vacantUnits: 0,
          maintenanceUnits: 0,
          occupancyRate: 0,
          rentCollectedThisMonth: 0,
          outstandingBalance: 0,
          delayedPayments: 0,
          incomeExpenseData: [],
          revenueTrendData: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  const occupancyData = [
    { name: "Occupied", value: stats.occupiedUnits, fill: "hsl(142, 55%, 42%)" },
    { name: "Vacant", value: stats.vacantUnits, fill: "hsl(0, 84.2%, 60.2%)" },
    { name: "Maintenance", value: stats.maintenanceUnits, fill: "hsl(38, 92%, 50%)" },
  ]

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      <div className="space-y-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Property management overview and key metrics at a glance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Properties - Rose/Terracotta */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
            <CardTitle className="text-sm font-semibold text-foreground">Total Properties</CardTitle>
            <div className="rounded-lg bg-primary/15 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-bold text-primary">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{stats.activeProperties} active</p>
          </CardContent>
        </Card>

        {/* Occupancy Rate - Deep Green */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-secondary/10 to-secondary/5 border-b-2 border-secondary/20">
            <CardTitle className="text-sm font-semibold text-foreground">Occupancy Rate</CardTitle>
            <div className="rounded-lg bg-secondary/15 p-3">
              <PieChart className="h-6 w-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-bold text-secondary">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {stats.occupiedUnits}/{stats.totalUnits} units
            </p>
          </CardContent>
        </Card>

        {/* Rent Collected - Gold/Yellow */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-accent/10 to-accent/5 border-b-2 border-accent/20">
            <CardTitle className="text-sm font-semibold text-foreground">Rent Collected</CardTitle>
            <div className="rounded-lg bg-accent/15 p-3">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-accent">
              UGX {Math.round(stats.rentCollectedThisMonth / 1000000)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">This month</p>
          </CardContent>
        </Card>

        {/* Outstanding - Red/Destructive */}
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-destructive/10 to-destructive/5 border-b-2 border-destructive/20">
            <CardTitle className="text-sm font-semibold text-foreground">Outstanding</CardTitle>
            <div className="rounded-lg bg-destructive/15 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-destructive">
              UGX {Math.round(stats.outstandingBalance / 1000000)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">{stats.delayedPayments} delayed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b-2 border-primary/10">
            <CardTitle className="text-lg font-semibold text-foreground">Revenue Trend</CardTitle>
            <CardDescription className="text-sm">Rent collected vs outstanding</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                collected: { label: "Collected", color: "hsl(142, 55%, 42%)" },
                outstanding: { label: "Outstanding", color: "hsl(0, 84.2%, 60.2%)" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke="hsl(142, 55%, 42%)"
                    strokeWidth={3}
                    name="Collected"
                    dot={{ fill: "hsl(142, 55%, 42%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outstanding"
                    stroke="hsl(0, 84.2%, 60.2%)"
                    strokeWidth={3}
                    name="Outstanding"
                    dot={{ fill: "hsl(0, 84.2%, 60.2%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5 border-b-2 border-secondary/10">
            <CardTitle className="text-lg font-semibold text-foreground">Unit Status</CardTitle>
            <CardDescription className="text-sm">Occupancy distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                occupied: { label: "Occupied", color: "hsl(142, 55%, 42%)" },
                vacant: { label: "Vacant", color: "hsl(0, 84.2%, 60.2%)" },
                maintenance: { label: "Maintenance", color: "hsl(38, 92%, 50%)" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 md:col-span-2">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b-2 border-accent/10">
            <CardTitle className="text-lg font-semibold text-foreground">Income vs Expenses</CardTitle>
            <CardDescription className="text-sm">Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                income: { label: "Income", color: "hsl(142, 55%, 42%)" },
                expense: { label: "Expenses", color: "hsl(38, 92%, 50%)" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.incomeExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(142, 55%, 42%)" name="Income" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(38, 92%, 50%)" name="Expenses" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
