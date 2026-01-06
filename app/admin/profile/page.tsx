"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, MapPin, Building2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  phone_number: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  company_name: string | null
  company_address: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    company_name: "",
    company_address: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/admin/profile")
      const result = await response.json()
      if (result.success) {
        setProfile(result.data)
        setFormData({
          full_name: result.data.full_name || "",
          phone: result.data.phone || "",
          phone_number: result.data.phone_number || "",
          address: result.data.address || "",
          city: result.data.city || "",
          state: result.data.state || "",
          zip_code: result.data.zip_code || "",
          company_name: result.data.company_name || "",
          company_address: result.data.company_address || "",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      if (result.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setProfile(result.data)
        fetchProfile()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "AD"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <span className="text-xl font-semibold">Admin Profile & Settings</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Side Panel - Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">{profile.full_name || "Admin User"}</h3>
                      <p className="text-sm text-muted-foreground">{profile.role}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
                      </div>
                    </div>

                    {profile.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">{profile.phone}</p>
                        </div>
                      </div>
                    )}

                    {(profile.address || profile.city || profile.state) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {[profile.address, profile.city, profile.state, profile.zip_code]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {profile.company_name && (
                      <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Company</p>
                          <p className="text-sm text-muted-foreground">{profile.company_name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member since</span>
                      <span>{format(new Date(profile.created_at), "MMM yyyy")}</span>
                    </div>
                    {profile.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last updated</span>
                        <span>{format(new Date(profile.updated_at), "MMM dd, yyyy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information and company details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+256 700 000 000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone_number">Alternate Phone</Label>
                            <Input
                              id="phone_number"
                              value={formData.phone_number}
                              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                              placeholder="+256 700 000 001"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Address</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Main Street"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="Kampala"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              placeholder="Central"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                            <Input
                              id="zip_code"
                              value={formData.zip_code}
                              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                              placeholder="00100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Company Information Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            placeholder="Property Management Company Ltd"
                          />
                        </div>

                        <div>
                          <Label htmlFor="company_address">Company Address</Label>
                          <Textarea
                            id="company_address"
                            value={formData.company_address}
                            onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                            placeholder="Company street address, city, state, zip code"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Email (Read-only) */}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={profile.email} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed for security purposes
                      </p>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Link href="/admin">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
