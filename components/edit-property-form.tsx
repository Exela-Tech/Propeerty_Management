"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { updateProperty } from "@/app/(dashboard)/properties/actions"

interface EditPropertyFormProps {
  property: any
  landlords: any[]
}

export function EditPropertyForm({ property, landlords }: EditPropertyFormProps) {
  const [propertyType, setPropertyType] = useState(property.property_type)
  const [landlordId, setLandlordId] = useState(property.owner_id || "")
  const [commissionType, setCommissionType] = useState(property.commission_type || "percentage")
  const [managementFeeType, setManagementFeeType] = useState(property.management_fee_type || "percentage")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("property_type", propertyType)
    formData.set("landlord_id", landlordId)
    formData.set("commission_type", commissionType)
    formData.set("management_fee_type", managementFeeType)
    startTransition(() => {
      updateProperty(formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={property.id} />

      <div>
        <Label htmlFor="name">Property Name</Label>
        <Input id="name" name="name" defaultValue={property.name} placeholder="Enter property name" required />
      </div>

      <div>
        <Label htmlFor="property_type">Property Type</Label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger id="property_type">
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="land">Land</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          defaultValue={property.location || ""}
          placeholder="Enter property location"
        />
      </div>

      <div>
        <Label htmlFor="total_units">Total Units</Label>
        <Input
          id="total_units"
          name="total_units"
          type="number"
          defaultValue={property.total_units || 0}
          placeholder="Number of units"
        />
      </div>

      <div>
        <Label htmlFor="landlord_id">Landlord</Label>
        <Select value={landlordId} onValueChange={setLandlordId}>
          <SelectTrigger id="landlord_id">
            <SelectValue placeholder="Select landlord" />
          </SelectTrigger>
          <SelectContent>
            {landlords?.map((landlord) => (
              <SelectItem key={landlord.id} value={landlord.id}>
                {landlord.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={property.description || ""}
          placeholder="Enter property description"
          rows={4}
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Management Commission Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="commission_type">Commission Type</Label>
            <Select value={commissionType} onValueChange={setCommissionType}>
              <SelectTrigger id="commission_type">
                <SelectValue placeholder="Select commission type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount (UGX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="commission_value">
              {commissionType === "percentage" ? "Commission Percentage (%)" : "Fixed Amount (UGX)"}
            </Label>
            <Input
              id="commission_value"
              name="commission_value"
              type="number"
              defaultValue={property.commission_value || 10}
              placeholder={commissionType === "percentage" ? "e.g., 10" : "e.g., 50000"}
              step={commissionType === "percentage" ? "0.1" : "1"}
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {commissionType === "percentage" 
                ? "This percentage will be deducted as management fee when paying the landlord" 
                : "This fixed amount will be deducted as management fee when paying the landlord"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Updating..." : "Update Property"}
        </button>
        <Button asChild variant="outline" className="flex-1 bg-transparent" disabled={isPending}>
          <Link href="/properties">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
