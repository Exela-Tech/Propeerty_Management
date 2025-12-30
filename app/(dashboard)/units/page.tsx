import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Plus } from "lucide-react"
import Link from "next/link"
import { UnitActionButtons } from "./unit-action-buttons"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default async function UnitsPage() {
  const [unitsResult, propertiesResult] = await Promise.all([
    supabase.from("units").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name"),
  ])

  const units = unitsResult.data || []
  const properties = propertiesResult.data || []

  const propertyMap = new Map(properties.map((p) => [p.id, p]))

  const unitsWithProperties = units.map((unit) => ({
    ...unit,
    property: propertyMap.get(unit.property_id),
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Units</h1>
          <p className="text-muted-foreground mt-1">Manage individual units across all properties</p>
        </div>
        <Button asChild>
          <Link href="/units/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Link>
        </Button>
      </div>

      {unitsWithProperties.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No units yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first unit</p>
          <Button asChild>
            <Link href="/units/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Unit Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Property</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Bedrooms</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Monthly Rent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unitsWithProperties.map((unit) => (
                <tr key={unit.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{unit.unit_number}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{unit.property?.name || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant={unit.status === "occupied" ? "default" : "secondary"}>{unit.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">{unit.bedrooms || "-"}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {unit.currency || "UGX"} {Number.parseFloat(unit.monthly_rent || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/units/${unit.id}/edit`}>Edit</Link>
                      </Button>
                      <UnitActionButtons unitId={unit.id} />
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
