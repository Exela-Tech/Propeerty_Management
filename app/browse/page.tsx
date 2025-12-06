import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Bed, Bath, MapPin } from "lucide-react"
import Link from "next/link"
import type { Property } from "@/lib/types"
import { PropertyFilters } from "@/components/property-filters"

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string
    property_type?: string
    min_bedrooms?: string
    max_rent?: string
  }>
}) {
  const { city, property_type, min_bedrooms, max_rent } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from("properties")
    .select("*, profiles!properties_landlord_id_fkey(role)")
    .eq("status", "approved")

  // Apply filters with input validation
  if (city) {
    // Sanitize city input: trim whitespace and limit length
    const sanitizedCity = city.trim().slice(0, 100)
    // Supabase's ilike uses parameterized queries, but we sanitize for defense in depth
    query = query.ilike("city", `%${sanitizedCity}%`)
  }
  if (property_type) {
    query = query.eq("property_type", property_type)
  }
  if (min_bedrooms) {
    query = query.gte("bedrooms", Number.parseInt(min_bedrooms))
  }
  if (max_rent) {
    query = query.lte("rent_amount", Number.parseFloat(max_rent))
  }

  const { data: properties } = await query.order("created_at", { ascending: false })

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
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Browse Properties</h1>
            <p className="text-muted-foreground">Find your perfect home</p>
          </div>

          {/* Filters */}
          <PropertyFilters />

          {/* Results */}
          <div className="mt-8">
            {properties && properties.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{properties.length} properties found</p>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {properties.map((property: Property) => (
                    <Link key={property.id} href={`/browse/${property.id}`}>
                      <Card className="h-full transition-shadow hover:shadow-lg">
                        <CardHeader>
                          <div className="mb-2 flex items-start justify-between">
                            <Badge variant="secondary" className="capitalize">
                              {property.property_type}
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {property.rent_amount != null ? `$${property.rent_amount.toLocaleString()}` : "Contact for price"}
                              </div>
                              <div className="text-xs text-muted-foreground">per month</div>
                            </div>
                          </div>
                          <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}, {property.state}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{property.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span>{property.bedrooms} bed</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4 text-muted-foreground" />
                              <span>{property.bathrooms} bath</span>
                            </div>
                            {property.square_feet && (
                              <div className="flex items-center gap-1">
                                <span>{property.square_feet.toLocaleString()} sqft</span>
                              </div>
                            )}
                          </div>
                          {property.amenities && property.amenities.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1">
                              {property.amenities.slice(0, 3).map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {property.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{property.amenities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No properties found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters to see more results</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
