"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTransition } from "react"
import { updateAdminProfile } from "./actions"
import { useRouter } from "next/navigation"

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  company_name?: string
  notes?: string
}

interface AdminProfileFormProps {
  profile: AdminProfile
  userId: string
}

export function AdminProfileForm({ profile, userId }: AdminProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState(profile)
  const [successMessage, setSuccessMessage] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage("")

    startTransition(async () => {
      const result = await updateAdminProfile(userId, formData)
      if (result.success) {
        setSuccessMessage("Profile updated successfully!")
        setTimeout(() => setSuccessMessage(""), 3000)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">{successMessage}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            value={formData.first_name || ""}
            onChange={handleInputChange}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            value={formData.last_name || ""}
            onChange={handleInputChange}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          disabled
          placeholder="Email (cannot be changed)"
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleInputChange}
            placeholder="Phone number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            name="company_name"
            value={formData.company_name || ""}
            onChange={handleInputChange}
            placeholder="Company name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address || ""}
          onChange={handleInputChange}
          placeholder="Street address"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city || ""} onChange={handleInputChange} placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            name="state"
            value={formData.state || ""}
            onChange={handleInputChange}
            placeholder="State/Province"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP/Postal Code</Label>
          <Input
            id="zip_code"
            name="zip_code"
            value={formData.zip_code || ""}
            onChange={handleInputChange}
            placeholder="ZIP/Postal code"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleInputChange}
          placeholder="Any additional notes or information"
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}
