import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getServiceClient } from "@/lib/supabase/server"
import { EditPropertyForm } from "@/components/edit-property-form"

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params

  const supabase = getServiceClient()

  const { data: propertyData, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, property_type, location, total_units, owner_id, description, management_fee")
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
