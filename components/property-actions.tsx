"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Check, X } from "lucide-react"
import type { PropertyStatus } from "@/lib/types"

interface PropertyActionsProps {
  propertyId: string
  currentStatus: PropertyStatus
}

export function PropertyActions({ propertyId, currentStatus }: PropertyActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const updateStatus = async (status: PropertyStatus) => {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("properties").update({ status }).eq("id", propertyId)

    if (error) {
      console.error("[Error] Failed to update property status:", error.message)
      // TODO: Show toast notification to user
      setIsLoading(false)
      return
    }

    router.refresh()
    setIsLoading(false)
  }

  return (
    <>
      {currentStatus === "pending" && (
        <>
          <Button onClick={() => updateStatus("approved")} disabled={isLoading} className="flex-1">
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
          <Button
            onClick={() => updateStatus("rejected")}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </>
      )}
      {currentStatus === "approved" && (
        <Button onClick={() => updateStatus("rejected")} disabled={isLoading} variant="destructive" className="flex-1">
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
      )}
      {currentStatus === "rejected" && (
        <Button onClick={() => updateStatus("approved")} disabled={isLoading} className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
      )}
    </>
  )
}
