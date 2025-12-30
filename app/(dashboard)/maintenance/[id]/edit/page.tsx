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
import { updateMaintenanceRequest, getMaintenanceRequest } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"

export default function EditMaintenanceRequestPage() {
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const { toast } = useToast()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    async function loadRequest() {
      try {
        const data = await getMaintenanceRequest(id)
        setRequest(data)
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
    loadRequest()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await updateMaintenanceRequest(id, formData)

      toast({
        title: "Success",
        description: "Maintenance request updated successfully",
      })

      window.location.href = "/maintenance"
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
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">Request not found</div>
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
          <CardTitle>Edit Maintenance Request</CardTitle>
          <CardDescription>Update the maintenance request details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={request.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" defaultValue={request.description} rows={4} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" required defaultValue={request.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select name="priority" required defaultValue={request.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
