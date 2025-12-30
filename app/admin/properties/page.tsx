import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"
import Link from "next/link"
import type { Property } from "@/lib/types"
import { PropertyActions } from "@/components/property-actions"

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  let query = supabase.from("properties").select("*, profiles!properties_landlord_id_fkey(full_name, email)")

  if (status) {
    query = query.eq("status", status)
  }

  const { data: properties } = await query.order("created_at", { ascending: false })

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-semibold">PropertyHub Admin</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost">Admin Dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Property Management</h1>
            <p className="text-muted-foreground">Review and approve property listings</p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2">
            <Link href="/admin/properties">
              <Button variant={!status ? "default" : "outline"}>All Properties</Button>
            </Link>
            <Link href="/admin/properties?status=pending">
              <Button variant={status === "pending" ? "default" : "outline"}>Pending</Button>
            </Link>
            <Link href="/admin/properties?status=approved">
              <Button variant={status === "approved" ? "default" : "outline"}>Approved</Button>
            </Link>
            <Link href="/admin/properties?status=rejected">
              <Button variant={status === "rejected" ? "default" : "outline"}>Rejected</Button>
            </Link>
          </div>

          {properties && properties.length > 0 ? (
            <div className="grid gap-6">
              {properties.map((property: Property & { profiles: { full_name: string; email: string } }) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                          <Badge
                            variant={
                              property.status === "approved"
                                ? "default"
                                : property.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {property.status}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {property.city}, {property.state} • Listed by {property.profiles.full_name || "Unknown"} (
                          {property.profiles.email})
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{property.property_type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bedrooms:</span>
                          <span className="font-medium">{property.bedrooms}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bathrooms:</span>
                          <span className="font-medium">{property.bathrooms}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rent:</span>
                          <span className="font-medium">${(property.rent_amount ?? 0).toLocaleString()}/mo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Deposit:</span>
                          <span className="font-medium">${(property.deposit_amount ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-medium">{property.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="line-clamp-2 text-sm text-muted-foreground">{property.description}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <PropertyActions propertyId={property.id} currentStatus={property.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No properties found</h3>
                <p className="text-sm text-muted-foreground">
                  {status ? `No ${status} properties at the moment` : "No properties have been listed yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
