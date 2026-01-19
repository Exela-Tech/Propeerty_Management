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
import { CheckCircle, Copy } from "lucide-react"
import { approveTeamMember } from "./user-management-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeamMember {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  invited_at: string
  created_by?: string
}

export function PendingTeamMembersTable({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; email?: string; password?: string }>({
    open: false,
  })
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (teamMemberId: string) => {
    const assignedRole = selectedRoles[teamMemberId] || teamMembers.find((tm) => tm.id === teamMemberId)?.role

    setLoading(teamMemberId)
    const result = await approveTeamMember(teamMemberId, assignedRole!)
    setLoading(null)

    if (result.success && result.tempPassword) {
      setApprovalDialog({ open: true, email: result.email, password: result.tempPassword })
    } else if (result.error) {
      alert(result.error)
    }
  }

  const copyCredentials = () => {
    if (approvalDialog.email && approvalDialog.password) {
      navigator.clipboard.writeText(`Email: ${approvalDialog.email}\nPassword: ${approvalDialog.password}`)
    }
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No pending team members</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Requested Role</TableHead>
            <TableHead>Assign Role</TableHead>
            <TableHead>Invited</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.first_name} {member.last_name}
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{member.role.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={selectedRoles[member.id] || member.role}
                  onValueChange={(value) => setSelectedRoles({ ...selectedRoles, [member.id]: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="property_manager">Property Manager</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="support_staff">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(member.invited_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => handleApprove(member.id)} disabled={loading === member.id}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve & Create Account
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approval Success Dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Member Approved Successfully!</DialogTitle>
            <DialogDescription>The user account has been created. Share these credentials with the user.</DialogDescription>
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
            <Button variant="outline" onClick={() => window.location.reload()}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
