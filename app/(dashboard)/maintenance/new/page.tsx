"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createMaintenanceRequest, getProperties, getUnits, getTenants } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewMaintenanceRequestPage() {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        const props = await getProperties()
        setProperties(props)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      setUnits([])
      setTenants([])
      setSelectedUnit("")
      getUnits(selectedProperty).then(setUnits)
    }
  }, [selectedProperty])

  useEffect(() => {
    if (selectedUnit && selectedUnit !== "none") {
      getTenants(selectedUnit).then(setTenants)
    } else {
      setTenants([])
    }
  }, [selectedUnit])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createMaintenanceRequest(formData)

      toast({
        title: "Success",
        description: "Maintenance request created successfully",
      })

      // Wait for toast to be visible before redirecting
      setTimeout(() => {
        window.location.href = "/maintenance"
      }, 1500)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">Loading form...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/maintenance">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Maintenance
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Maintenance Request</CardTitle>
          <CardDescription>Submit a new maintenance request for a property</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="property_id">Property *</Label>
              <Select name="property_id" required onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && (
              <div className="space-y-2">
                <Label htmlFor="unit_id">Unit</Label>
                <Select name="unit_id" onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific unit (General property issue)</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedUnit && selectedUnit !== "none" && tenants.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="tenant_id">Tenant (Optional)</Label>
                <Select name="tenant_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific tenant</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" placeholder="e.g., Leaky faucet, Broken AC..." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed description of the issue..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction_month">Deduct From Month</Label>
              <Select name="deduction_month" defaultValue={new Date().toISOString().slice(0, 7)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date()
                    date.setMonth(date.getMonth() + i)
                    const monthValue = date.toISOString().slice(0, 7)
                    const monthLabel = date.toLocaleString("default", { month: "long", year: "numeric" })
                    return (
                      <SelectItem key={monthValue} value={monthValue}>
                        {monthLabel}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select which month this expense should be deducted from the landlord payment. Default is current month.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" required defaultValue="medium">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" placeholder="0.00" min="0" />
                <p className="text-sm text-muted-foreground">
                  Optional. Will create a pending expense for admin approval.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
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
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
