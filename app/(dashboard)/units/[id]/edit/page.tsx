"use client"

import type React from "react"
import { use, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateUnit, getUnit, getProperties } from "../../actions"
import { useToast } from "@/hooks/use-toast"

export default function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [unit, setUnit] = useState<any>(null)
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const [unitResult, propertiesResult] = await Promise.all([getUnit(id), getProperties()])

      if (unitResult.success && unitResult.data) {
        setUnit(unitResult.data)
        if (propertiesResult.success) {
          setProperties(propertiesResult.data)
          const property = propertiesResult.data.find((p: any) => p.id === unitResult.data.property_id)
          setSelectedPropertyType(property?.property_type || null)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load unit data",
          variant: "destructive",
        })
      }
    }
    loadData()
  }, [id, toast])

  function handlePropertyChange(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId)
    setSelectedPropertyType(property?.property_type || null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateUnit(id, formData)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "Failed to update unit",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Unit updated successfully",
      })
      setTimeout(() => {
        window.location.href = "/units"
      }, 500)
    }
    setLoading(false)
  }

  if (!unit) {
    return <div className="p-8">Loading...</div>
  }

  const isResidential = selectedPropertyType?.toLowerCase() === "residential"
  const isIndustrial = selectedPropertyType?.toLowerCase() === "industrial"

  return (
    <div className="p-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/units">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Units
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Unit</CardTitle>
          <CardDescription>Update unit information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select name="property_id" required defaultValue={unit.property_id} onValueChange={handlePropertyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.property_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_number">Unit Number *</Label>
              <Input
                id="unit_number"
                name="unit_number"
                placeholder="e.g., 101, A1, Suite 500"
                defaultValue={unit.unit_number}
                required
              />
            </div>

            {isResidential && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    name="bedrooms"
                    type="number"
                    min="0"
                    placeholder="e.g., 2"
                    defaultValue={unit.bedrooms || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 1.5"
                    defaultValue={unit.bathrooms || ""}
                  />
                </div>
              </div>
            )}

            {isIndustrial && (
              <div className="space-y-2">
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input
                  id="square_feet"
                  name="square_feet"
                  type="number"
                  min="0"
                  placeholder="e.g., 850"
                  defaultValue={unit.square_feet || ""}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue={unit.currency || "UGX"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent_amount">Rent Amount *</Label>
                <Input
                  id="rent_amount"
                  name="rent_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 1200.00"
                  defaultValue={unit.monthly_rent || ""}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={unit.status || "vacant"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Unit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
