import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { EditPropertyForm } from "@/components/edit-property-form"

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params

  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch (error) {
          console.error("[v0] Error setting cookies:", error)
        }
      },
    },
  })

  const { data: propertyData, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, property_type, location, total_units, owner_id, description")
    .eq("id", propertyId)
    .limit(1)

  const { data: landlordsData } = await supabase.from("owners").select("id, name").order("name")

  if (propertyError || !propertyData || propertyData.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/properties">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-semibold text-destructive mb-4">Failed to load property</p>
            <Button asChild>
              <Link href="/properties">Back to Properties</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const property = propertyData[0]

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/properties">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Property</h1>
          <p className="text-muted-foreground mt-1">Update property information</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPropertyForm property={property} landlords={landlordsData || []} />
        </CardContent>
      </Card>
    </div>
  )
}
