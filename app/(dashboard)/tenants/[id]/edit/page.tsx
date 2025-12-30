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
import { getProperties, getVacantUnits, getTenant, updateTenant } from "../../actions"
import { useToast } from "@/hooks/use-toast"

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const [tenantData, propertiesData] = await Promise.all([getTenant(id), getProperties()])

        if (!tenantData) {
          toast({
            title: "Error",
            description: "Tenant not found",
            variant: "destructive",
          })
          router.push("/tenants")
          return
        }

        setTenant(tenantData)
        setProperties(propertiesData)
        setSelectedProperty(tenantData.property_id)
        setSelectedUnit(tenantData.unit_id || "")

        // Load units for the current property
        if (tenantData.property_id) {
          const unitsData = await getVacantUnits(tenantData.property_id)
          // Include the current unit even if it's occupied
          setUnits(unitsData)
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load tenant data",
          variant: "destructive",
        })
      } finally {
        setPageLoading(false)
      }
    }
    loadData()
  }, [id, toast, router])

  useEffect(() => {
    if (selectedProperty && selectedProperty !== tenant?.property_id) {
      async function loadUnits() {
        const data = await getVacantUnits(selectedProperty)
        setUnits(data)
        setSelectedUnit("")
      }
      loadUnits()
    }
  }, [selectedProperty, tenant])

  useEffect(() => {
    if (selectedUnit) {
      const selectedUnitData = units.find((u) => u.id === selectedUnit)
      if (selectedUnitData) {
        const rentInput = document.querySelector('input[name="monthly_rent"]') as HTMLInputElement
        if (rentInput) {
          rentInput.value = selectedUnitData.monthly_rent.toString()
        }
      }
    }
  }, [selectedUnit, units])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    const result = await updateTenant(id, formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      })
      window.location.href = "/tenants"
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update tenant",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  if (pageLoading || !tenant) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading tenant...</p>
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
          <CardTitle>Edit Tenant</CardTitle>
          <CardDescription>Update tenant information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" name="first_name" defaultValue={tenant.first_name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" name="last_name" defaultValue={tenant.last_name} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={tenant.email || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={tenant.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select
                name="property_id"
                required
                defaultValue={tenant.property_id}
                onValueChange={(value) => setSelectedProperty(value)}
              >
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
              <Select name="unit_id" value={selectedUnit} onValueChange={(value) => setSelectedUnit(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                value={units.find((u) => u.id === selectedUnit)?.unit_number || tenant.unit_number || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={tenant.lease_start_date?.split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent_due_day">Rent Due Day *</Label>
                <Select name="rent_due_day" defaultValue={tenant.rent_due_day?.toString() || "1"} required>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">Monthly Rent *</Label>
                <Input
                  id="monthly_rent"
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={tenant.monthly_rent}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" defaultValue={tenant.currency || "UGX"} required>
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
              <Label htmlFor="deposit_amount">Security Deposit</Label>
              <Input
                id="deposit_amount"
                name="deposit_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={tenant.deposit_amount || 0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Tenant Status *</Label>
                <Select name="status" defaultValue={tenant.status} required>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status *</Label>
                <Select name="payment_status" defaultValue={tenant.payment_status} required>
                  <SelectTrigger id="payment_status">
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Tenant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
