"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, Check } from "lucide-react"
import { toggleTenantStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
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

export function TenantActionButtons({ tenantId, tenantStatus }: { tenantId: string; tenantStatus: string }) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const isActive = tenantStatus === "active"

  const handleToggleStatus = async () => {
    setIsUpdating(true)
    try {
      await toggleTenantStatus(tenantId, isActive ? "inactive" : "active")
      toast({
        title: "Success",
        description: `Tenant marked as ${isActive ? "inactive" : "active"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tenant status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${isActive ? "text-destructive bg-transparent hover:text-destructive" : "text-green-600 bg-transparent hover:text-green-600"}`}
        >
          {isActive ? (
            <>
              <AlertCircle className="h-4 w-4 mr-1" />
              Disable
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Activate
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isActive ? "Disable Tenant" : "Activate Tenant"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? "Marking this tenant as inactive will remove them from active rent collection but preserve their data for historical records."
              : "This will restore the tenant to active status and include them in rent collection."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={isActive ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
          >
            {isUpdating ? "Updating..." : isActive ? "Disable" : "Activate"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
