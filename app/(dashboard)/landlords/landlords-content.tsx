"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { deleteLandlord } from "./actions"

export function LandlordsContent({ initialLandlords }: { initialLandlords: any[] }) {
  const [landlords, setLandlords] = React.useState(initialLandlords)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landlords</h1>
          <p className="text-muted-foreground">Manage landlord records for tracking and reporting</p>
        </div>
        <Link href="/landlords/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Landlord
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Landlords</CardTitle>
          <CardDescription>View and manage all landlord records in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {landlords && landlords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((landlord) => (
                  <TableRow key={landlord.id}>
                    <TableCell className="font-medium">{landlord.name}</TableCell>
                    <TableCell>{landlord.email}</TableCell>
                    <TableCell>{landlord.phone || "—"}</TableCell>
                    <TableCell>{landlord.city || "—"}</TableCell>
                    <TableCell className="space-x-2">
                      <Link href={`/landlords/${landlord.id}/edit`}>
                        <Button size="sm" variant="ghost">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <LandlordDeleteButton
                        landlordId={landlord.id}
                        landlordName={landlord.name}
                        onDeleteSuccess={() =>
                          setLandlords((prevLandlords) => prevLandlords.filter((l) => l.id !== landlord.id))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No landlords found</p>
              <Link href="/landlords/new">
                <Button className="mt-4 bg-transparent" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Landlord
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LandlordDeleteButton({
  landlordId,
  landlordName,
  onDeleteSuccess,
}: {
  landlordId: string
  landlordName: string
  onDeleteSuccess: () => void
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    if (window.confirm(`Are you sure you want to delete ${landlordName}?`)) {
      setIsDeleting(true)
      const result = await deleteLandlord(landlordId)
      if (result.success) {
        onDeleteSuccess()
      } else {
        setIsDeleting(false)
        alert(result.error || "Failed to delete landlord")
      }
    }
  }

  return (
    <Button size="sm" variant="ghost" onClick={handleDelete} disabled={isDeleting}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
