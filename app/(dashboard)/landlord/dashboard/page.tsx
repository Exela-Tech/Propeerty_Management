import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DollarSign, Users, TrendingUp } from "lucide-react"

export default async function LandlordDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "landlord") {
    redirect("/dashboard")
  }

  // Get landlord stats
  const { data: properties } = await supabase.from("properties").select("*").eq("landlord_id", user.id)

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .in("property_id", properties?.map((p) => p.id) || [])

  const occupiedUnits = units?.filter((u) => u.status === "occupied").length || 0

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold">Welcome, {profile.first_name}!</h1>
        <p className="text-lg text-muted-foreground">Your landlord dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Properties
            </CardTitle>
            <CardDescription>Total properties</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{properties?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Units
            </CardTitle>
            <CardDescription>Total units</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{units?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">{occupiedUnits} occupied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Occupancy
            </CardTitle>
            <CardDescription>Current rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {units && units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue
            </CardTitle>
            <CardDescription>View in reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Check Financials page for detailed revenue reports</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Overview</CardTitle>
          <CardDescription>Your properties at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          {properties && properties.length > 0 ? (
            <div className="space-y-2">
              {properties.map((property) => (
                <div key={property.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{property.name}</p>
                    <p className="text-sm text-muted-foreground">{property.address}</p>
                  </div>
                  <p className="text-sm font-medium">{property.total_units} units</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No properties found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
