import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getCashFlowStatement } from "@/app/(dashboard)/accounting/actions"
import { formatCurrency } from "@/lib/utils"

export default async function CashFlowPage() {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
  const endDate = today.toISOString().split('T')[0]
  const cashFlow = await getCashFlowStatement(startDate, endDate)

  // Simplified cash flow - categorize transactions
  const operatingInflow = (cashFlow.transactions || []).filter((t: any) => 
    t.chart_of_accounts?.account_type === 'income'
  ).reduce((sum: number, t: any) => sum + (t.credit || 0), 0)
  
  const operatingOutflow = (cashFlow.transactions || []).filter((t: any) => 
    t.chart_of_accounts?.account_type === 'expense'
  ).reduce((sum: number, t: any) => sum + (t.debit || 0), 0)

  const chartData = [
    {
      name: "Operating",
      inflow: operatingInflow,
      outflow: operatingOutflow,
    },
    {
      name: "Investing",
      inflow: 0,
      outflow: 0,
    },
    {
      name: "Financing",
      inflow: 0,
      outflow: 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
        <p className="text-gray-500 mt-2">Track cash movement across your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Operating Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(operatingInflow - operatingOutflow)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Investing Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ending Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(operatingInflow - operatingOutflow)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: string | number | (string | number)[]) => {
                if (typeof value === 'number' || typeof value === 'string') {
                  return formatCurrency(Number(value))
                }
                return value
              }} />
              <Legend />
              <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
              <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
