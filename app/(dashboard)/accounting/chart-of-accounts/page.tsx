import { getChartOfAccounts, getAccountBalances } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: "Chart of Accounts",
  description: "View all accounts and their balances",
}

interface AccountBalance {
  id: string
  account_code: string
  account_name: string
  account_type: string
  normal_balance: string
  current_balance: number
}

export default async function ChartOfAccountsPage() {
  let accounts, balances
  
  try {
    accounts = await getChartOfAccounts()
    balances = await getAccountBalances()
  } catch (error) {
    console.error("Error fetching chart of accounts:", error)
    accounts = { asset: [], liability: [], equity: [], income: [], expense: [] }
    balances = []
  }

  const accountBalanceMap = new Map(balances.map((b: AccountBalance) => [b.id, b]))

  const accountTypes = [
    { key: "asset", label: "Assets", color: "bg-blue-50 border-blue-200" },
    { key: "liability", label: "Liabilities", color: "bg-red-50 border-red-200" },
    { key: "equity", label: "Equity", color: "bg-purple-50 border-purple-200" },
    { key: "income", label: "Income", color: "bg-green-50 border-green-200" },
    { key: "expense", label: "Expenses", color: "bg-orange-50 border-orange-200" },
  ]

  return (
    <div className="space-y-6">
      {accountTypes.map((type) => {
        const typeAccounts = accounts[type.key as keyof typeof accounts] || []
        if (typeAccounts.length === 0) return null

        const totalBalance = typeAccounts.reduce((sum: number, account: { id: string }) => {
          const balance = accountBalanceMap.get(account.id)
          return sum + (balance?.current_balance || 0)
        }, 0)

        return (
          <Card key={type.key} className={`border ${type.color}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{type.label}</CardTitle>
                <Badge variant="outline">{typeAccounts.length} accounts</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold">Code</th>
                      <th className="text-left py-2 px-2 font-semibold">Account Name</th>
                      <th className="text-left py-2 px-2 font-semibold">Description</th>
                      <th className="text-right py-2 px-2 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeAccounts.map((account: { id: string; account_code: string; account_name: string; description?: string }) => {
                      const balance = accountBalanceMap.get(account.id)
                      const balanceAmount = balance?.current_balance || 0
                      const isNegative = balanceAmount < 0

                      return (
                        <tr key={account.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-mono font-bold">{account.account_code}</td>
                          <td className="py-3 px-2 font-medium">{account.account_name}</td>
                          <td className="py-3 px-2 text-muted-foreground text-xs">{account.description}</td>
                          <td
                            className={`py-3 px-2 text-right font-mono ${isNegative ? "text-red-600" : "text-green-600"}`}
                          >
                            {balanceAmount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "UGX",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center font-bold">
                <span>{type.label} Total</span>
                <span className="font-mono text-lg">
                  {totalBalance.toLocaleString("en-US", {
                    style: "currency",
                    currency: "UGX",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
