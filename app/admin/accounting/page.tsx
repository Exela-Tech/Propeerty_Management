import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Building2, DollarSign, TrendingUp, TrendingDown, Receipt, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AccountingDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  let schemaReady = false

  try {
    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Use Date objects for proper date handling instead of string interpolation
    const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]

    // Try to fetch accounting data - if any query fails, schema is not ready
    const [paymentsResult, expensesResult, payoutsResult, tenantsResult, pendingPayoutsResult] = await Promise.all([
      supabase
        .from("rent_payments")
        .select("amount_paid, commission_amount")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .eq("status", "paid"),
      supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", startDate)
        .lt("expense_date", endDate),
      supabase.from("landlord_payouts").select("total_payout").eq("month", currentMonth).eq("year", currentYear),
      supabase.from("tenants").select("*", { count: "exact", head: true }),
      supabase.from("landlord_payouts").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ])

    // Check if any query returned an error
    if (
      paymentsResult.error ||
      expensesResult.error ||
      payoutsResult.error ||
      tenantsResult.error ||
      pendingPayoutsResult.error
    ) {
      schemaReady = false
    } else {
      schemaReady = true

      // Calculate stats
      const payments = paymentsResult.data || []
      const expenses = expensesResult.data || []
      const payouts = payoutsResult.data || []

      const stats = {
        totalRentCollected: payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0),
        totalCommission: payments.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0),
        totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
        totalPayouts: payouts.reduce((sum, p) => sum + Number(p.total_payout || 0), 0),
        netProfit: 0,
        totalTenants: tenantsResult.count || 0,
        pendingPayouts: pendingPayoutsResult.count || 0,
        paymentsCount: payments.length,
        expensesCount: expenses.length,
        collectionRate: 0,
      }

      stats.netProfit = stats.totalCommission - stats.totalExpenses
      stats.collectionRate = stats.totalTenants ? Math.round((payments.length / stats.totalTenants) * 100) : 0

      // Render the dashboard with stats
      return (
        <div className="flex min-h-svh flex-col">
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-semibold">PropertyHub - Accounting</span>
              </div>
              <nav className="flex items-center gap-4">
                <Link href="/admin">
                  <Button variant="ghost">Admin Dashboard</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <form
                  action={async () => {
                    "use server"
                    const supabase = await createClient()
                    await supabase.auth.signOut()
                    redirect("/")
                  }}
                >
                  <Button variant="ghost" type="submit">
                    Logout
                  </Button>
                </form>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
                <p className="text-muted-foreground">
                  Financial overview for {now.toLocaleString("default", { month: "long" })} {currentYear}
                </p>
              </div>

              {/* Financial Stats */}
              <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Rent Collected</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">UGX {stats.totalRentCollected.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{stats.paymentsCount} payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      UGX {stats.totalCommission.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">10% average rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">UGX {stats.totalExpenses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{stats.expensesCount} expenses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      UGX {stats.netProfit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Commission - Expenses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rent Collection</CardTitle>
                    <CardDescription>Record and track rent payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/accounting/rent-collection">
                      <Button className="w-full">Manage Payments</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Landlord Accounts</CardTitle>
                    <CardDescription>View ledgers and payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/accounting/landlords">
                      <Button className="w-full">View Landlords</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expenses</CardTitle>
                    <CardDescription>Track company expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/accounting/expenses">
                      <Button className="w-full">Manage Expenses</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Reports</CardTitle>
                    <CardDescription>Financial statements & exports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/accounting/reports">
                      <Button className="w-full">View Reports</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      )
    }
  } catch (error: any) {
    schemaReady = false
  }

  // If schema is not ready, show migration message
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-semibold">PropertyHub - Accounting</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost">Admin Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Accounting System Not Set Up</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                The accounting system requires database migration script 007 to be run first. This will create the
                necessary tables and columns for:
              </p>
              <ul className="mb-4 ml-6 list-disc space-y-1">
                <li>Tenant management with accounting fields</li>
                <li>Rent payments with month, year, and commission tracking (10%)</li>
                <li>Landlord payouts and ledgers</li>
                <li>Expense tracking</li>
              </ul>
              <p className="font-semibold">
                Please run the SQL script:{" "}
                <code className="rounded bg-muted px-2 py-1">scripts/007_create_accounting_system.sql</code>
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  )
}
