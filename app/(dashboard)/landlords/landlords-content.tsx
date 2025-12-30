"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit2, Trash2 } from "lucide-react"
import { deleteLandlord } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function LandlordsContent({ initialLandlords }: { initialLandlords: any[] }) {
  const [landlords, setLandlords] = React.useState(initialLandlords)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteLandlord(id)

    if (result.success) {
      setLandlords((prev) => prev.filter((l) => l.id !== id))
    } else {
      alert(result.error || "Failed to delete landlord")
    }

    setDeletingId(null)
  }

  // If no landlords, render nothing inside CardContent
  if (landlords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Landlords</CardTitle>
          <CardDescription>
            View and manage all landlord records in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Intentionally empty */}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Landlords</CardTitle>
        <CardDescription>
          View and manage all landlord records in the system
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {landlords.map((landlord) => (
              <TableRow key={landlord.id}>
                <TableCell className="font-medium">{landlord.name}</TableCell>
                <TableCell>{landlord.email}</TableCell>
                <TableCell>{landlord.phone || "—"}</TableCell>
                <TableCell>{landlord.city || "—"}</TableCell>

                <TableCell className="text-right space-x-1">
                  <Link href={`/landlords/${landlord.id}/edit`}>
                    <Button size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete landlord?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove <strong>{landlord.name}</strong>. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(landlord.id)}
                          disabled={deletingId === landlord.id}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
