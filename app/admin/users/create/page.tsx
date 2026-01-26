"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Copy, CheckCircle } from "lucide-react"
import { createUserManually } from "../user-management-actions"
import { useToast } from "@/hooks/use-toast"

export default function CreateUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.role) {
      const message = "Please select a role for this user."
      setError(message)
      setLoading(false)
      toast({
        title: "Role required",
        description: message,
        variant: "destructive",
      })
      return
    }

    const result = await createUserManually(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      toast({
        title: "Failed to create user",
        description: result.error,
        variant: "destructive",
      })
    } else if (result.success && result.tempPassword) {
      setSuccess({ email: result.email, password: result.tempPassword })
      setLoading(false)
      toast({
        title: "User created",
        description: "Temporary credentials have been generated.",
      })
    }
  }

  const copyCredentials = () => {
    if (success) {
      navigator.clipboard.writeText(`Email: ${success.email}\nPassword: ${success.password}`)
    }
  }

  if (success) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>User Created Successfully!</CardTitle>
            </div>
            <CardDescription>Share these login credentials with the user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Login Credentials:</p>
                  <p>Email: {success.email}</p>
                  <p>Temporary Password: {success.password}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    User will be required to change password on first login.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={copyCredentials}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Credentials
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/users")}>
                Back to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create User Manually
          </CardTitle>
          <CardDescription>
            Create a new user account with temporary password. User will be required to change password on first login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                required
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="support_staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
