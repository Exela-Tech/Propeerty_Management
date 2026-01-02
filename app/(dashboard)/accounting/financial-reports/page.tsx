import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, TrendingUp, CreditCard } from "lucide-react"

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-gray-500 mt-2">Generate and view financial statements for your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Profit & Loss Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">View your income and expenses for a specific period</p>
            <Link href="/accounting/financial-reports/profit-loss">
              <Button>View P&L</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Balance Sheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Check your assets, liabilities, and equity as of a specific date</p>
            <Link href="/accounting/financial-reports/balance-sheet">
              <Button>View Balance Sheet</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Cash Flow Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Track cash inflows and outflows across your business</p>
            <Button disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>P&L Statement:</strong> Shows revenues, expenses, and net income for a period
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Balance Sheet:</strong> Displays financial position (Assets = Liabilities + Equity)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Cash Flow:</strong> Tracks operating, investing, and financing activities
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
