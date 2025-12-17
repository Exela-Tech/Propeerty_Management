import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Bed, Bath, Square, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    redirect("/dashboard/properties/new")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: property } = await supabase.from("properties").select("*").eq("id", id).single()

  if (!property) {
    notFound()
  }

  // Check if user owns this property
  if (property.landlord_id !== user.id) {
    redirect("/dashboard/properties")
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
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/dashboard/properties">
              <Button variant="ghost">My Properties</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{property.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.address}, {property.city}, {property.state} {property.zip_code}
                </span>
              </div>
            </div>
            <Badge
              variant={
                property.status === "approved" ? "default" : property.status === "pending" ? "secondary" : "destructive"
              }
            >
              {property.status}
            </Badge>
          </div>

          <div className="mb-6 flex gap-4">
            <Link href={`/dashboard/properties/${property.id}/edit`}>
              <Button>Edit Property</Button>
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.from("properties").delete().eq("id", id)
                redirect("/dashboard/properties")
              }}
            >
              <Button type="submit" variant="destructive">
                Delete Property
              </Button>
            </form>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Bedrooms:</span>
                    <span className="font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Bathrooms:</span>
                    <span className="font-medium">{property.bathrooms}</span>
                  </div>
                  {property.square_feet && (
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Square Feet:</span>
                      <span className="font-medium">{property.square_feet.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{property.property_type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Monthly Rent:</span>
                  </div>
                  <span className="text-lg font-bold">${property.rent_amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Security Deposit:</span>
                  </div>
                  <span className="text-lg font-bold">${property.deposit_amount.toLocaleString()}</span>
                </div>
                {property.available_from && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Available From:</span>
                    </div>
                    <span className="font-medium">{new Date(property.available_from).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
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
        </div>
      </main>
    </div>
  )
}
