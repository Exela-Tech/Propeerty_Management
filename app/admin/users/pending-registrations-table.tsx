"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Copy } from "lucide-react"
import { approveRegistration, rejectRegistration } from "./user-management-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Registration {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  requested_role: string
  created_at: string
}

export function PendingRegistrationsTable({ registrations }: { registrations: Registration[] }) {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; email?: string; password?: string }>({
    open: false,
  })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; registrationId?: string }>({ open: false })
  const [rejectionReason, setRejectionReason] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleApprove = async (registrationId: string) => {
    setError(null)
    const assignedRole =
      selectedRoles[registrationId] || registrations.find((r) => r.id === registrationId)?.requested_role

    if (!assignedRole) {
      const message = "Please select a role before approving this registration."
      setError(message)
      toast({
        title: "Role required",
        description: message,
        variant: "destructive",
      })
      return
    }

    setLoading(registrationId)
    const result = await approveRegistration(registrationId, assignedRole)
    setLoading(null)

    if (result.success && result.tempPassword) {
      setApprovalDialog({ open: true, email: result.email, password: result.tempPassword })
      toast({
        title: "User approved",
        description: "The user account has been created successfully.",
      })
    } else if (result.error) {
      setError(result.error)
      toast({
        title: "Failed to approve user",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.registrationId) return

    setLoading(rejectDialog.registrationId)
    const result = await rejectRegistration(rejectDialog.registrationId, rejectionReason)
    setLoading(null)
    setRejectDialog({ open: false })
    setRejectionReason("")

    if (result?.error) {
      toast({
        title: "Failed to reject registration",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Registration rejected",
        description: "The registration request has been rejected.",
      })
    }
  }

  const copyCredentials = () => {
    if (approvalDialog.email && approvalDialog.password) {
      navigator.clipboard.writeText(`Email: ${approvalDialog.email}\nPassword: ${approvalDialog.password}`)
    }
  }

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No pending registrations</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Requested Role</TableHead>
            <TableHead>Assign Role</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell className="font-medium">
                {reg.first_name} {reg.last_name}
              </TableCell>
              <TableCell>{reg.email}</TableCell>
              <TableCell>{reg.phone || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{reg.requested_role.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={selectedRoles[reg.id] || reg.requested_role}
                  onValueChange={(value) => setSelectedRoles({ ...selectedRoles, [reg.id]: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="property_manager">Property Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="support_staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(reg.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(reg.id)} disabled={loading === reg.id}>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectDialog({ open: true, registrationId: reg.id })}
                    disabled={loading === reg.id}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approval Success Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Approved Successfully!</DialogTitle>
            <DialogDescription>The account has been created. Share these credentials with the user.</DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Login Credentials:</p>
                <p>Email: {approvalDialog.email}</p>
                <p>Temporary Password: {approvalDialog.password}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  User will be required to change password on first login.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={copyCredentials}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Credentials
            </Button>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this registration request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
