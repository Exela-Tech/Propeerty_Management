"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { approveAction, rejectAction } from "@/app/(dashboard)/team/pending-actions"
import { CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function ApprovalActions({ actionId, reviewerId }: { actionId: string; reviewerId: string }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleApprove = async () => {
    setLoading(true)
    const result = await approveAction(actionId, reviewerId)
    if (result.success) {
      router.refresh()
    }
    setLoading(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    setLoading(true)
    const result = await rejectAction(actionId, reviewerId, rejectionReason)
    if (result.success) {
      setShowRejectDialog(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleApprove} disabled={loading} className="flex-1">
        <CheckCircle className="mr-2 h-4 w-4" />
        Approve
      </Button>
      <Button onClick={() => setShowRejectDialog(true)} disabled={loading} variant="destructive" className="flex-1">
        <XCircle className="mr-2 h-4 w-4" />
        Reject
      </Button>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Action</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this action</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={loading || !rejectionReason.trim()} className="flex-1">
                Confirm Rejection
              </Button>
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
