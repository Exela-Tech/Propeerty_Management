import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { PropertyActionButtons } from "./property-action-buttons"

export default async function PropertiesPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const [{ data: properties, error: propertiesError }, { data: owners, error: ownersError }] = await Promise.all([
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("owners").select("id, name"),
  ])

  if (propertiesError) {
    console.error("Error loading properties:", propertiesError)
  }

  const ownerMap = new Map(owners?.map((o) => [o.id, o.name]) || [])

  const propertiesWithOwners = properties?.map((property) => ({
    ...property,
    ownerName: ownerMap.get(property.owner_id) || "N/A",
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage all properties in the system</p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {!propertiesWithOwners || propertiesWithOwners.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first property</p>
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Owner</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Units</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {propertiesWithOwners.map((property) => (
                <tr key={property.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{property.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge variant="secondary">{property.property_type}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{property.location || "-"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{property.ownerName}</td>
                  <td className="px-6 py-4 text-sm font-medium">{property.total_units || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                      </Button>
                      <PropertyActionButtons propertyId={property.id} />
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
