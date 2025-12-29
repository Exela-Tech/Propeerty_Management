"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { deleteLandlord } from "@/app/(dashboard)/landlords/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function LandlordsClientContent({ initialLandlords }: { initialLandlords: any[] }) {
  const [landlords, setLandlords] = useState(initialLandlords)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  async function handleDelete(landlordId: string, landlordName: string) {
    if (!confirm(`Are you sure you want to delete ${landlordName}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(landlordId)
    try {
      const result = await deleteLandlord(landlordId)
      if (result.success) {
        setLandlords((prev) => prev.filter((l) => l.id !== landlordId))
        toast({
          title: "Success",
          description: "Landlord deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete landlord",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (landlords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No landlords found</p>
        <Link href="/landlords/new">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Landlord
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Payment Due Day</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {landlords.map((landlord) => (
          <TableRow key={landlord.id}>
            <TableCell className="font-medium">{landlord.name || "—"}</TableCell>
            <TableCell>{landlord.email || "—"}</TableCell>
            <TableCell>{landlord.phone || "—"}</TableCell>
            <TableCell>{landlord.address || "—"}</TableCell>
            <TableCell>{landlord.city || "—"}</TableCell>
            <TableCell>
              {landlord.payment_due_day
                ? `${landlord.payment_due_day === 5 ? "5th" : landlord.payment_due_day === 15 ? "15th" : "30th"} of month`
                : "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/landlords/${landlord.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(landlord.id, landlord.name)}
                  disabled={deletingId === landlord.id}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
