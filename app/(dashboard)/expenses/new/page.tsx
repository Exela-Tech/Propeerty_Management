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
import { createExpense, getProperties } from "../actions"
import { useToast } from "@/hooks/use-toast"

export default function NewExpensePage() {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createExpense(formData)

      toast({
        title: "Success",
        description: "Expense recorded successfully",
      })

      // Wait a bit for the toast to be visible before redirecting
      setTimeout(() => {
        window.location.href = "/expenses"
      }, 1000)
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
        <Link href="/expenses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Record New Expense</CardTitle>
          <CardDescription>Add a property-related or internal business expense</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Expense Category *</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="wage">Wage</SelectItem>
                  <SelectItem value="internet">Internet</SelectItem>
                  <SelectItem value="field_expense">Field Expense</SelectItem>
                  <SelectItem value="office_rent">Office Rent</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property (Optional)</Label>
              <Select name="property_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select property (leave blank for internal expenses)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Internal Expense)</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.property_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave blank for internal business expenses like salaries or office rent
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Date *</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select name="currency" required defaultValue="UGX">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., Plumbing repair, Property tax, Insurance payment..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Recording..." : "Record Expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
