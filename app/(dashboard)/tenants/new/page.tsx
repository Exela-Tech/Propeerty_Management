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
import { getProperties, getVacantUnits, createTenant } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewTenantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")

  useEffect(() => {
    async function loadProperties() {
      console.log("[v0] Loading properties...")
      try {
        const data = await getProperties()
        console.log("[v0] Properties loaded:", data)
        setProperties(data)
      } catch (error) {
        console.error("[v0] Error loading properties:", error)
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        })
      } finally {
        setPageLoading(false)
      }
    }
    loadProperties()
  }, [toast])

  useEffect(() => {
    if (selectedProperty) {
      async function loadUnits() {
        const data = await getVacantUnits(selectedProperty)
        setUnits(data)
      }
      loadUnits()
    } else {
      setUnits([])
      setSelectedUnit("")
    }
  }, [selectedProperty])

  useEffect(() => {
    if (selectedUnit) {
      const unit = units.find((u) => u.id === selectedUnit)
      if (unit) {
        const rentInput = document.getElementById("monthly_rent") as HTMLInputElement
        const currencyInput = document.getElementById("currency") as HTMLInputElement
        if (rentInput) rentInput.value = unit.monthly_rent?.toString() || ""
        if (currencyInput) currencyInput.value = unit.currency || "UGX"
      }
    }
  }, [selectedUnit, units])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const result = await createTenant(formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Tenant created successfully",
      })
      window.location.href = "/tenants"
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create tenant",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading form...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/tenants">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tenants
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Tenant</CardTitle>
          <CardDescription>Create a new tenant record and assign to a unit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" name="first_name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" name="last_name" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select name="property_id" required onValueChange={(value) => setSelectedProperty(value)}>
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
              <Label htmlFor="unit_id">Unit</Label>
              <Select
                name="unit_id"
                disabled={!selectedProperty || units.length === 0}
                onValueChange={(value) => setSelectedUnit(value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedProperty
                        ? "Select property first"
                        : units.length === 0
                          ? "No available units"
                          : "Select unit"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="unit_number"
                value={units.find((u) => u.id === selectedUnit)?.unit_number || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input id="start_date" name="start_date" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent_due_day">Rent Due Day *</Label>
                <Select name="rent_due_day" defaultValue="1" required>
                  <SelectTrigger id="rent_due_day">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                        {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"} of each month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The day of the month when rent is due (e.g., 5th, 15th, etc.)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Lease End Date</Label>
              <Input id="due_date" name="due_date" type="date" />
              <p className="text-sm text-muted-foreground">Optional: The date when the lease agreement ends</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Monthly Rent *</Label>
                <Input id="monthly_rent" name="monthly_rent" type="number" step="0.01" min="0" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue="UGX" required>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Security Deposit (Optional)</Label>
              <Input id="deposit_amount" name="deposit_amount" type="number" step="0.01" min="0" defaultValue="0" />
              <p className="text-sm text-muted-foreground">
                Optional one-time security deposit. Leave as 0 if not applicable. This helps track security deposit
                records in case of tenant claims.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Tenant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
