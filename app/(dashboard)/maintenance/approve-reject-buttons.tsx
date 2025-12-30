"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { approveMaintenanceRequest, rejectMaintenanceRequest } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function ApproveRejectButtons({ requestId }: { requestId: string }) {
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const formData = new FormData()
      formData.append("request_id", requestId)
      await approveMaintenanceRequest(formData)

      toast({
        title: "Success",
        description: "Maintenance request approved successfully",
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve request",
        variant: "destructive",
      })
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      const formData = new FormData()
      formData.append("request_id", requestId)
      await rejectMaintenanceRequest(formData)

      toast({
        title: "Success",
        description: "Maintenance request rejected",
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      })
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button size="sm" className="gap-2" onClick={handleApprove} disabled={isApproving || isRejecting}>
        <Check className="h-4 w-4" />
        {isApproving ? "Approving..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="gap-2"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
      >
        <X className="h-4 w-4" />
        {isRejecting ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  )
}
