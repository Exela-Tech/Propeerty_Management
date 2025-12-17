import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Bed, Bath, Square, DollarSign, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: property } = await supabase
    .from("properties")
    .select("*, profiles!properties_landlord_id_fkey(full_name, email, phone)")
    .eq("id", id)
    .single()

  if (!property || property.status !== "approved") {
    notFound()
  }

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
            <Link href="/browse">
              <Button variant="ghost">Browse</Button>
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
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <Link href="/browse">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>

          <div className="mb-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{property.title}</h1>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {property.address}, {property.city}, {property.state} {property.zip_code}
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {property.property_type}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-primary">${property.rent_amount.toLocaleString()}</div>
              <span className="text-muted-foreground">per month</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Bedrooms:</span>
                      <span className="font-semibold">{property.bedrooms}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Bathrooms:</span>
                      <span className="font-semibold">{property.bathrooms}</span>
                    </div>
                    {property.square_feet && (
                      <div className="flex items-center gap-2">
                        <Square className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">Square Feet:</span>
                        <span className="font-semibold">{property.square_feet.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-semibold capitalize">{property.property_type}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.description}</p>
                </CardContent>
              </Card>

              {property.amenities && property.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Monthly Rent:</span>
                    </div>
                    <span className="text-lg font-bold">${property.rent_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Security Deposit:</span>
                    </div>
                    <span className="text-lg font-bold">${property.deposit_amount.toLocaleString()}</span>
                  </div>
                  {property.available_from && (
                    <div className="flex items-center justify-between pb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Available From:</span>
                      </div>
                      <span className="font-medium">{new Date(property.available_from).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-4">
                    {user ? (
                      <Button className="w-full" size="lg">
                        Contact Landlord
                      </Button>
                    ) : (
                      <>
                        <Link href="/auth/sign-up" className="block">
                          <Button className="w-full" size="lg">
                            Sign Up to Contact
                          </Button>
                        </Link>
                        <Link href="/auth/login" className="block">
                          <Button variant="outline" className="w-full bg-transparent">
                            Already have an account?
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Landlord Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p className="font-medium">{property.profiles.full_name || "Not provided"}</p>
                    </div>
                    {user && (
                      <>
                        <div>
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <p className="font-medium">{property.profiles.email}</p>
                        </div>
                        {property.profiles.phone && (
                          <div>
                            <span className="text-sm text-muted-foreground">Phone:</span>
                            <p className="font-medium">{property.profiles.phone}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
