"use client"

import { Button } from "@/components/ui/button"
import { Edit, Trash2, Download } from "lucide-react"
import { deletePayment } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function PaymentActionButtons({ paymentId }: { paymentId: string }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePayment(paymentId)
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" asChild title="View Receipt">
        <Link href={`/payments/${paymentId}/receipt`}>
          <Download className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/payments/${paymentId}/edit`}>
          <Edit className="h-4 w-4" />
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
