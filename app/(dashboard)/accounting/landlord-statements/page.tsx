import { getLandlordStatements } from "../actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: "Landlord Statements",
  description: "View accounting statements for all landlords",
}

export default async function LandlordStatementsPage() {
  let statements
  try {
    statements = await getLandlordStatements()
  } catch (error) {
    console.error("Error fetching landlord statements:", error)
    statements = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Landlord Accounting Statements</h1>
        <p className="text-muted-foreground mt-2">View what each landlord is owed after all deductions</p>
      </div>

      <div className="grid gap-4">
        {statements.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No landlord statements available</p>
            </CardContent>
          </Card>
        ) : (
          statements.map((landlord: any) => (
            <Link key={landlord.landlord_id} href={`/accounting/landlord-statements/${landlord.landlord_id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{landlord.landlord_name}</CardTitle>
                    <Badge variant={landlord.balance_owed > 0 ? "default" : "secondary"}>
                      {landlord.balance_owed > 0 ? "Owed" : "Settled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Rent Collected</p>
                      <p className="font-mono font-bold">{(landlord.total_rent_collected || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Management Fees</p>
                      <p className="font-mono font-bold text-orange-600">
                        -{(landlord.total_management_fees || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Expenses</p>
                      <p className="font-mono font-bold text-red-600">
                        -{(landlord.total_expenses || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commissions</p>
                      <p className="font-mono font-bold text-red-600">
                        -{(landlord.total_commissions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Balance Owed</p>
                      <p className="font-mono font-bold text-lg">{(landlord.balance_owed || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
