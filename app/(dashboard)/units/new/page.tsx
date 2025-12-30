"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createUnit, getProperties } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewUnitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null)

  useEffect(() => {
    async function loadProperties() {
      const result = await getProperties()
      if (result.success) {
        setProperties(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        })
      }
    }
    loadProperties()
  }, [toast])

  function handlePropertyChange(propertyId: string) {
    const property = properties.find((p) => p.id === propertyId)
    setSelectedPropertyType(property?.property_type || null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const result = await createUnit(formData)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "Failed to create unit",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Unit created successfully",
      })
      setTimeout(() => {
        window.location.href = "/units"
      }, 500)
    }
    setLoading(false)
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
          <CardTitle>Add New Unit</CardTitle>
          <CardDescription>Create a new unit within a property</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select name="property_id" required onValueChange={handlePropertyChange}>
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
              <Input id="unit_number" name="unit_number" placeholder="e.g., 101, A1, Suite 500" required />
            </div>

            {isResidential && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" type="number" min="0" placeholder="e.g., 2" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" step="0.5" min="0" placeholder="e.g., 1.5" />
                </div>
              </div>
            )}

            {isIndustrial && (
              <div className="space-y-2">
                <Label htmlFor="square_feet">Square Feet</Label>
                <Input id="square_feet" name="square_feet" type="number" min="0" placeholder="e.g., 850" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue="UGX">
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
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="vacant">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Unit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
