"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { updateLandlord } from "../../actions"

export default function EditLandlordPage() {
  const router = useRouter()
  const params = useParams()
  const landlordId = params.id as string

  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [landlord, setLandlord] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLandlord() {
      try {
        const response = await fetch(`/api/landlords/${landlordId}`)
        const data = await response.json()

        if (data.success) {
          setLandlord(data.data)
        } else {
          setError("Failed to load landlord")
        }
      } catch {
        setError("Failed to load landlord")
      }
    }

    fetchLandlord()
  }, [landlordId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateLandlord(landlordId, formData)

    if (result.success) {
      toast({
        title: "Success",
        description: "Landlord updated successfully",
      })
      router.push("/landlords")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update landlord",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/landlords">
          <Button variant="ghost">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Landlords
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!landlord) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/landlords">
        <Button variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Landlords
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Landlord</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  defaultValue={landlord.name?.split(" ")[0] || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  defaultValue={landlord.name?.split(" ").slice(1).join(" ") || ""}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={landlord.email || ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={landlord.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={landlord.address || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={landlord.city || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_due_day">Payment Due Day</Label>
              <select
                id="payment_due_day"
                name="payment_due_day"
                defaultValue={landlord.payment_due_day || "30"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="5">5th of the month</option>
                <option value="15">15th of the month</option>
                <option value="30">End of month (30th)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={landlord.notes || ""} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Landlord
              </Button>
              <Link href="/landlords">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
