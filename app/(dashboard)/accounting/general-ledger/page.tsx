import { getGeneralLedger } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "General Ledger",
  description: "View all transactions and journal entries",
}

export default async function GeneralLedgerPage() {
  const ledgerEntries = await getGeneralLedger()

  const referenceTypeColors = {
    tenant_payment: "bg-blue-100 text-blue-800",
    landlord_payment: "bg-purple-100 text-purple-800",
    maintenance: "bg-orange-100 text-orange-800",
    expense: "bg-red-100 text-red-800",
    journal_entry: "bg-gray-100 text-gray-800",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="text-left py-3 px-3 font-semibold">Date</th>
                <th className="text-left py-3 px-3 font-semibold">Account</th>
                <th className="text-left py-3 px-3 font-semibold">Description</th>
                <th className="text-left py-3 px-3 font-semibold">Type</th>
                <th className="text-right py-3 px-3 font-semibold">Debit</th>
                <th className="text-right py-3 px-3 font-semibold">Credit</th>
                <th className="text-right py-3 px-3 font-semibold">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-muted-foreground">
                    No transactions recorded yet
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry: any) => (
                  <tr key={entry.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3 font-mono text-xs">{entry.transaction_date}</td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold">{entry.account?.account_code}</div>
                      <div className="text-xs text-muted-foreground">{entry.account?.account_name}</div>
                    </td>
                    <td className="py-3 px-3 text-sm">{entry.description}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant="outline"
                        className={referenceTypeColors[entry.reference_type as keyof typeof referenceTypeColors] || ""}
                      >
                        {entry.reference_type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {entry.debit > 0 ? entry.debit.toLocaleString("en-US") : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {entry.credit > 0 ? entry.credit.toLocaleString("en-US") : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {entry.running_balance.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
