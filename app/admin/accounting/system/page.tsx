import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  FileText,
  Receipt,
  CreditCard,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Calculator,
  FileBarChart,
  Lock,
  Banknote,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"

export default async function AccountingSystemPage() {
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

  // Get basic accounting stats
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const [accountsCount, journalEntriesCount, glEntriesCount, landlordsCount] = await Promise.all([
    supabase.from("chart_of_accounts").select("*", { count: "exact", head: true }),
    supabase
      .from("journal_entries")
      .select("*", { count: "exact", head: true })
      .eq("period_month", currentMonth)
      .eq("period_year", currentYear),
    supabase
      .from("general_ledger")
      .select("*", { count: "exact", head: true })
      .eq("period_month", currentMonth)
      .eq("period_year", currentYear)
      .eq("status", "POSTED"),
    supabase.from("owners").select("*", { count: "exact", head: true }),
  ])

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            <span className="text-xl font-semibold">Full Accounting System</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin/accounting">
              <Button variant="ghost">Accounting Dashboard</Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost">Admin Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Full-Fledged Accounting System</h1>
            <p className="text-muted-foreground">
              Comprehensive accounting module with Trust Accounting principles for property management
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chart of Accounts</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accountsCount.count || 0}</div>
                <p className="text-xs text-muted-foreground">Total accounts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journalEntriesCount.count || 0}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GL Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{glEntriesCount.count || 0}</div>
                <p className="text-xs text-muted-foreground">Posted this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Landlords</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{landlordsCount.count || 0}</div>
                <p className="text-xs text-muted-foreground">Active landlords</p>
              </CardContent>
            </Card>
          </div>

          {/* Core Accounting Modules */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Core Accounting</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Chart of Accounts
                  </CardTitle>
                  <CardDescription>Manage hierarchical account structure</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/chart-of-accounts">
                    <Button className="w-full">View Chart of Accounts</Button>
                  </Link>
                  <Link href="/admin/accounting/system/chart-of-accounts/new">
                    <Button variant="outline" className="w-full">
                      Add New Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    General Ledger
                  </CardTitle>
                  <CardDescription>View all posted transactions with running balances</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/general-ledger">
                    <Button className="w-full">View General Ledger</Button>
                  </Link>
                  <Link href="/admin/accounting/system/general-ledger/trial-balance">
                    <Button variant="outline" className="w-full">
                      Trial Balance
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Journal Entries
                  </CardTitle>
                  <CardDescription>Create and manage journal entries (General, Sales, Purchase, Cash)</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/journal-entries">
                    <Button className="w-full">View Journals</Button>
                  </Link>
                  <Link href="/admin/accounting/system/journal-entries/new">
                    <Button variant="outline" className="w-full">
                      New Journal Entry
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trust Accounting & Landlord Management */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Trust Accounting & Landlords</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Landlord Sub-ledgers
                  </CardTitle>
                  <CardDescription>
                    Individual accounting for each landlord (rent collected, expenses, fees, payouts)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/landlord-ledgers">
                    <Button className="w-full">View Sub-ledgers</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Trust Accounting
                  </CardTitle>
                  <CardDescription>
                    Rent Trust Liability tracking (rent held in trust for landlords)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/trust-accounting">
                    <Button className="w-full">View Trust Accounts</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Accounts Payable & Banking */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Accounts Payable & Banking</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Accounts Payable
                  </CardTitle>
                  <CardDescription>Track vendor bills, landlord payables, and payment aging</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/accounts-payable">
                    <Button className="w-full">View AP</Button>
                  </Link>
                  <Link href="/admin/accounting/system/accounts-payable/new">
                    <Button variant="outline" className="w-full">
                      New AP Invoice
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Bank Accounts
                  </CardTitle>
                  <CardDescription>Manage bank accounts (Trust, Operating, Payroll, Tax accounts)</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/bank-accounts">
                    <Button className="w-full">View Bank Accounts</Button>
                  </Link>
                  <Link href="/admin/accounting/system/bank-accounts/new">
                    <Button variant="outline" className="w-full">
                      Add Bank Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Bank Reconciliation
                  </CardTitle>
                  <CardDescription>Reconcile bank statements with book balances</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/bank-reconciliation">
                    <Button className="w-full">Reconcile Accounts</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Financial Reporting */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Financial Reporting</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profit & Loss
                  </CardTitle>
                  <CardDescription>Income statement showing revenue and expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/system/reports/profit-loss">
                    <Button className="w-full">View P&L</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5" />
                    Balance Sheet
                  </CardTitle>
                  <CardDescription>Assets, liabilities, and equity statement</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/system/reports/balance-sheet">
                    <Button className="w-full">View Balance Sheet</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cash Flow
                  </CardTitle>
                  <CardDescription>Cash flow statement</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/system/reports/cash-flow">
                    <Button className="w-full">View Cash Flow</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Trial Balance
                  </CardTitle>
                  <CardDescription>All account balances at a point in time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/accounting/system/reports/trial-balance">
                    <Button className="w-full">View Trial Balance</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Audit & Compliance */}
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Audit & Compliance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Period Locking
                  </CardTitle>
                  <CardDescription>Lock accounting periods to prevent modifications</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/periods">
                    <Button className="w-full">Manage Periods</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Audit Log
                  </CardTitle>
                  <CardDescription>View transaction history and audit trail</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Link href="/admin/accounting/system/audit-log">
                    <Button className="w-full">View Audit Log</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trust Accounting Principles Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Trust Accounting Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-blue-800">
                <li>
                  <strong>Tenant Rent = Liability:</strong> Rent collected from tenants is held in trust for landlords
                  and recorded as a liability, NOT as company income.
                </li>
                <li>
                  <strong>Management Fees = Income:</strong> Management fees charged to landlords are recorded as company
                  revenue.
                </li>
                <li>
                  <strong>Separate Accounts:</strong> Trust bank account (for rent) and Operating bank account (for
                  company operations) must be kept separate.
                </li>
                <li>
                  <strong>Landlord Sub-ledgers:</strong> Each landlord has an individual accounting showing rent
                  collected, expenses paid, fees charged, and net amount owed.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
