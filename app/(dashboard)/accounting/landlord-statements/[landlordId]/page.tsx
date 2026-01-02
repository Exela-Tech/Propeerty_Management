import { getLandlordSubledger } from "../../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Landlord Statement Details",
  description: "Detailed accounting statement for landlord",
}

export default async function LandlordStatementDetailPage({ params }: { params: { landlordId: string } }) {
  const subledger = await getLandlordSubledger(params.landlordId)

  if (subledger.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/accounting/landlord-statements"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Statements
        </Link>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No transactions found for this landlord</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const landlordName = subledger[0]?.landlord_id

  const summary = subledger.reduce(
    (acc, row) => ({
      totalRent: acc.totalRent + (row.rent_collected || 0),
      totalFees: acc.totalFees + (row.management_fee_deducted || 0),
      totalExpenses: acc.totalExpenses + (row.expense_deducted || 0),
      totalCommissions: acc.totalCommissions + (row.commission_deducted || 0),
      totalPaid: acc.totalPaid + (row.amount_paid_to_landlord || 0),
    }),
    { totalRent: 0, totalFees: 0, totalExpenses: 0, totalCommissions: 0, totalPaid: 0 },
  )

  const balanceOwed =
    summary.totalRent - summary.totalFees - summary.totalExpenses - summary.totalCommissions - summary.totalPaid

  return (
    <div className="space-y-6">
      <Link
        href="/accounting/landlord-statements"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Statements
      </Link>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rent Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalRent.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Management Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">-{summary.totalFees.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">-{summary.totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">-{summary.totalCommissions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Balance Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{balanceOwed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold">Type</th>
                  <th className="text-left py-3 px-3 font-semibold">Description</th>
                  <th className="text-right py-3 px-3 font-semibold">Rent</th>
                  <th className="text-right py-3 px-3 font-semibold">Fees</th>
                  <th className="text-right py-3 px-3 font-semibold">Expenses</th>
                  <th className="text-right py-3 px-3 font-semibold">Commission</th>
                  <th className="text-right py-3 px-3 font-semibold">Paid</th>
                  <th className="text-right py-3 px-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {subledger.map((row: any) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3 font-mono text-xs">{row.transaction_date}</td>
                    <td className="py-3 px-3">
                      <Badge variant="outline">{row.reference_type?.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3 px-3 text-sm">{row.description}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {row.rent_collected > 0 ? row.rent_collected.toLocaleString() : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-orange-600">
                      {row.management_fee_deducted > 0 ? `-${row.management_fee_deducted.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-red-600">
                      {row.expense_deducted > 0 ? `-${row.expense_deducted.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-red-600">
                      {row.commission_deducted > 0 ? `-${row.commission_deducted.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {row.amount_paid_to_landlord > 0 ? row.amount_paid_to_landlord.toLocaleString() : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">{row.balance_after.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
