"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createProperty } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewPropertyPage() {
  const [loading, setLoading] = useState(false)
  const [landlords, setLandlords] = useState<any[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from("owners").select("*").order("name")
      if (data) setLandlords(data)
    }
    loadData()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createProperty(formData)
      toast({
        title: "Success",
        description: "Property created successfully",
      })
      window.location.href = "/properties"
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Property</CardTitle>
          <CardDescription>Create a new property record in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input id="name" name="name" placeholder="e.g., Sunset Apartments" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type">Property Type *</Label>
              <Select name="property_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" placeholder="e.g., 123 Main Street, City, State" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_units">Total Units</Label>
              <Input
                id="total_units"
                name="total_units"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="Number of units"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlord_id">Property Owner (Landlord) *</Label>
              <Select name="landlord_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select landlord" />
                </SelectTrigger>
                <SelectContent>
                  {landlords.map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                <Link href="/landlords/new" className="text-primary hover:underline">
                  Create new landlord
                </Link>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Additional property details..." rows={4} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
