import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus } from "lucide-react"
import Link from "next/link"
import type { Property } from "@/lib/types"

export default async function PropertiesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !["seller", "blocker", "landlord"].includes(profile.role)) {
    redirect("/dashboard")
  }

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-semibold">PropertyHub</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/")
              }}
            >
              <Button variant="ghost" type="submit">
                Logout
              </Button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Properties</h1>
              <p className="text-muted-foreground">Manage your property listings</p>
            </div>
            <Link href="/dashboard/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </div>

          {properties && properties.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property: Property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {property.city}, {property.state}
                        </CardDescription>
                      </div>
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
                  </CardHeader>
                  <CardContent>
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
                        <span className="text-muted-foreground">Rent:</span>
                        <span className="font-medium">${(property.rent_amount ?? 0).toLocaleString()}/mo</span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/dashboard/properties/${property.id}`} className="flex-1">
                          <Button variant="outline" className="w-full bg-transparent">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/properties/${property.id}/edit`} className="flex-1">
                          <Button className="w-full">Edit</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">Get started by adding your first property</p>
                <Link href="/dashboard/properties/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
