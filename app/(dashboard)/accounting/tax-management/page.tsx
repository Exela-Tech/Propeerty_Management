import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Receipt, DollarSign } from "lucide-react"

export default function TaxManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tax Management</h1>
        <p className="text-gray-500 mt-2">Manage VAT, PAYE, and other tax obligations for Uganda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              VAT Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Track VAT at 18% on sales and purchases</p>
            <Link href="/accounting/tax-management/vat">
              <Button>Manage VAT</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              PAYE Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Calculate and manage employee PAYE deductions</p>
            <Link href="/accounting/tax-management/paye">
              <Button>Manage PAYE</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Tax Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Generate tax reports for URA filing</p>
            <Button disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uganda Tax Rates (2024/2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <p className="font-medium">VAT Rate</p>
                <p className="text-sm text-gray-600">Value Added Tax</p>
              </div>
              <span className="text-lg font-bold text-blue-600">18%</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <p className="font-medium">PAYE Rate</p>
                <p className="text-sm text-gray-600">Income tax (progressive)</p>
              </div>
              <span className="text-lg font-bold text-blue-600">0-35%</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Withholding Tax</p>
                <p className="text-sm text-gray-600">On services and supplies</p>
              </div>
              <span className="text-lg font-bold text-blue-600">5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
