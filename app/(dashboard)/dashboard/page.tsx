import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Wrench, DollarSign, Building, UserCircle } from "lucide-react"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach((cookie: any) => cookieStore.set(cookie.name, cookie.value, cookie.options))
        } catch {}
      },
    },
  })

  const [
    { count: propertiesCount },
    { count: unitsCount },
    { data: tenants },
    { count: ownersCount },
    { data: maintenanceData },
    { data: payments },
  ] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }).limit(1),

    supabase.from("units").select("id", { count: "exact", head: true }).limit(1),

    supabase
      .from("tenants")
      .select("id, first_name, last_name, email, unit_number, monthly_rent")
      .eq("status", "active")
      .limit(5), // Only fetch recent 5 tenants

    supabase.from("owners").select("id", { count: "exact", head: true }).limit(1),

    supabase
      .from("maintenance_requests")
      .select("id, title, status, priority, properties(name)")
      .eq("status", "pending")
      .limit(5), // Only fetch recent 5 requests

    supabase
      .from("tenant_payments")
      .select("amount")
      .gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
      .limit(1000), // Limit monthly payments query
  ])

  const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

  const stats = {
    properties: propertiesCount || 0,
    units: unitsCount || 0,
    tenants: tenants?.length || 0,
    owners: ownersCount || 0,
    maintenanceRequests: maintenanceData?.length || 0,
    totalRevenue,
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your property management operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Landlords</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.owners}</div>
            <p className="text-xs text-muted-foreground">Property owners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">Active properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.units}</div>
            <p className="text-xs text-muted-foreground">Total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tenants}</div>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceRequests}</div>
            <p className="text-xs text-muted-foreground">Maintenance requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {tenant.first_name} {tenant.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{tenant.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${tenant.monthly_rent}</p>
                      <p className="text-xs text-muted-foreground">{tenant.unit_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tenants yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceData && maintenanceData.length > 0 ? (
              <div className="space-y-4">
                {maintenanceData.map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">{request.properties?.[0]?.name}</p>
                    </div>
                    <div className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                      {request.priority}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
