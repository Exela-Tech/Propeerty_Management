import { getAccountBalances } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Trial Balance",
  description: "View trial balance summary",
}

export default async function TrialBalancePage() {
  const accounts = await getAccountBalances()

  let totalDebits = 0
  let totalCredits = 0

  accounts.forEach((account: any) => {
    if (account.normal_balance === "debit") {
      totalDebits += account.current_balance
    } else {
      totalCredits += account.current_balance
    }
  })

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trial Balance</CardTitle>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {isBalanced ? "Balanced ✓" : "Out of Balance ✗"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-3 px-3 font-semibold">Account Code</th>
                  <th className="text-left py-3 px-3 font-semibold">Account Name</th>
                  <th className="text-right py-3 px-3 font-semibold">Debit</th>
                  <th className="text-right py-3 px-3 font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account: any) => {
                  const isDebit = account.normal_balance === "debit"
                  const balance = account.current_balance

                  return (
                    <tr key={account.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-3 font-mono font-bold">{account.account_code}</td>
                      <td className="py-3 px-3 font-medium">{account.account_name}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        {isDebit && balance > 0 ? balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {!isDebit && balance > 0 ? balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-b-2 bg-muted font-bold">
                  <td colSpan={2} className="py-3 px-3">
                    TOTALS
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
