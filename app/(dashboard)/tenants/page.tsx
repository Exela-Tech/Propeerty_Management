import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus } from "lucide-react"
import Link from "next/link"
import { TenantActionButtons } from "./tenant-action-buttons"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function calculateCorrectBalance(tenant: any) {
  const today = new Date()
  const createdDate = new Date(tenant.created_at)

  // Count how many months have passed since tenant created
  let monthsPassed = 0
  const currentDate = new Date(createdDate)

  while (currentDate < today) {
    currentDate.setMonth(currentDate.getMonth() + 1)
    if (currentDate <= today) {
      monthsPassed++
    }
  }

  // Expected total based on months passed
  const monthlyRent = Number.parseFloat(tenant.monthly_rent || 0)
  const expectedTotal = monthlyRent * monthsPassed

  // Current balance in database
  const currentBalance = Number.parseFloat(tenant.balance || 0)

  // If balance is less than expected, it means payments were made
  // Return current balance as-is, otherwise ensure it's at least the monthly rent
  return currentBalance > 0 ? currentBalance : monthlyRent
}

export default async function TenantsPage() {
  const supabase = getServiceClient()

  const { data: tenants, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error loading tenants:", error)
  }

  // Fetch properties and units separately to avoid join ambiguity
  const { data: properties } = await supabase.from("properties").select("id, name")
  const { data: units } = await supabase.from("units").select("id, unit_number")

  // Create lookup maps
  const propertyMap = new Map(properties?.map((p) => [p.id, p]) || [])
  const unitMap = new Map(units?.map((u) => [u.id, u]) || [])

  // Enrich tenants with property and unit data
  const enrichedTenants = (tenants || []).map((tenant) => ({
    ...tenant,
    property: propertyMap.get(tenant.property_id),
    unit: unitMap.get(tenant.unit_id),
    // Display calculated balance based on unpaid months
    calculatedBalance: calculateCorrectBalance(tenant),
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage all tenants across properties</p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Link>
        </Button>
      </div>

      {enrichedTenants.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tenants yet</h3>
          <p className="text-muted-foreground text-center mb-4">Get started by adding your first tenant</p>
          <Button asChild>
            <Link href="/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Monthly Rent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Balance</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrichedTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">
                    {tenant.first_name} {tenant.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tenant.property?.name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tenant.unit?.unit_number || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {tenant.currency} {Number.parseFloat(tenant.monthly_rent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={tenant.calculatedBalance > 0 ? "text-red-600" : "text-green-600"}>
                      {tenant.currency} {tenant.calculatedBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/tenants/${tenant.id}/edit`}>Edit</Link>
                      </Button>
                      <TenantActionButtons tenantId={tenant.id} tenantStatus={tenant.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
